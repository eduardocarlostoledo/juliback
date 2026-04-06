const validator = require("validator");
const jwt = require("jsonwebtoken");
const { User } = require("../db");
const { encrypt, compare } = require("../helpers/bcrypt");
const { Op } = require("sequelize");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const fs = require("fs-extra");
const enviarPass = require("../mail/changePass");

const sanitizeField = (field) => {
  if (typeof field !== "string") return field;
  return validator.escape(validator.trim(field));
};

const buildAuthResponse = (user, provider = "credentials") => {
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      admin: user.admin,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    msg: "Login successful",
    token,
    provider,
    user: {
      token,
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      image: user.image,
      phonenumber: user.phonenumber,
      country: user.country,
      city: user.city,
      address: user.address,
      email: user.email,
      admin: user.admin,
      status: user.status,
    },
    success: true,
  };
};

const normalizeGooglePayload = (payload = {}) => {
  const {
    email,
    name,
    given_name,
    family_name,
    lastname,
    picture,
    image,
    email_verified,
  } = payload;

  return {
    email: email ? validator.normalizeEmail(email) : null,
    name: sanitizeField(given_name || name?.split(" ")?.[0] || name || "Usuario"),
    lastname: sanitizeField(
      family_name || lastname || name?.split(" ")?.slice(1).join(" ") || "Google"
    ),
    image: picture || image || null,
    emailVerified: email_verified !== false,
  };
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? validator.normalizeEmail(email) : null;
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({ msg: "User not found", success: false });
    }

    const checkPassword = await compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({ msg: "Invalid password", success: false });
    }

    return res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ msg: `Error 500 - ${error.message}` });
  }
};

const googleAuth = async (req, res) => {
  try {
    const googleProfile = normalizeGooglePayload(req.body);

    if (!googleProfile.email) {
      return res.status(400).json({ msg: "Missing email", success: false });
    }

    if (!googleProfile.emailVerified) {
      return res
        .status(401)
        .json({ msg: "Google email not verified", success: false });
    }

    let user = await User.findOne({ where: { email: googleProfile.email } });

    if (!user) {
      user = await User.create({
        name: googleProfile.name,
        lastname: googleProfile.lastname,
        email: googleProfile.email,
        image: {
          public_id: null,
          secure_url: googleProfile.image,
        },
        password: "GOOGLE_AUTH_USER",
      });
    } else {
      const updates = {};

      if (!user.name && googleProfile.name) {
        updates.name = googleProfile.name;
      }

      if (!user.lastname && googleProfile.lastname) {
        updates.lastname = googleProfile.lastname;
      }

      if ((!user.image || !user.image.secure_url) && googleProfile.image) {
        updates.image = {
          public_id: null,
          secure_url: googleProfile.image,
        };
      }

      if (Object.keys(updates).length) {
        await user.update(updates);
        user = await User.findByPk(user.id);
      }
    }

    return res.status(200).json(buildAuthResponse(user, "google"));
  } catch (error) {
    return res.status(500).json({ msg: `Error 500 - ${error.message}` });
  }
};

const getUsers = async () => {
  try {
    const result = await User.findAll();

    if (result) return result;
    throw new Error("Empy users database:");
  } catch (error) {
    throw new Error("Error retrieving Users Database" + error.message);
  }
};

const getUserId = async (userId) => {
  try {
    const result = await User.findByPk(userId);
    console.log(result, "entregando getuserid");
    if (result) return result;
    throw new Error("User not found with ID: " + userId);
  } catch (error) {
    throw new Error("Error retrieving User by ID: " + error.message);
  }
};

const putUser = async (user, image, id) => {
  if (!user || Object.keys(user).length === 0) {
    throw Error("No se recibio informacion del usuario");
  }

  user = JSON.parse(JSON.stringify(user));

  const {
    name = null,
    lastname = null,
    email = null,
    password = null,
    phonenumber = null,
    country = null,
    city = null,
    address = null,
    admin = undefined,
    status = undefined,
  } = user;

  try {
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = sanitizeField(name);
    if (lastname) fieldsToUpdate.lastname = sanitizeField(lastname);
    if (email && validator.isEmail(email)) {
      fieldsToUpdate.email = validator.normalizeEmail(email);
    }
    if (phonenumber) fieldsToUpdate.phonenumber = sanitizeField(phonenumber);
    if (country) fieldsToUpdate.country = sanitizeField(country);
    if (city) fieldsToUpdate.city = sanitizeField(city);
    if (address) fieldsToUpdate.address = sanitizeField(address);

    if (typeof admin === "boolean") fieldsToUpdate.admin = admin;
    if (typeof status === "boolean") fieldsToUpdate.status = status;

    if (password && typeof password === "string" && password.length >= 8) {
      fieldsToUpdate.password = await encrypt(password);
    }

    if (image) {
      const userToUpdate = await User.findByPk(id);
      const result = await uploadImage(image.tempFilePath);

      if (userToUpdate.image?.public_id) {
        await deleteImage(userToUpdate.image.public_id);
      }

      fieldsToUpdate.image = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };

      await fs.remove(image.tempFilePath);
    }

    await User.update(fieldsToUpdate, { where: { id } });
    return true;
  } catch (error) {
    throw Error(error.message);
  }
};

const postUserGoogle = googleAuth;
const loginGoogle = googleAuth;

const postUsers = async (req, res) => {
  const regexName = /^[a-zA-Z\s]+$/;
  const regexPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|:;"'<>,.?/~`]).{8,20}$/;
  const regexEmail = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;

  try {
    const { name, lastname, email, password } = req.body;

    if (!name || !lastname || !password || !email) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const infoUser = {};

    if (!regexEmail.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }
    const normalizedEmail = validator.normalizeEmail(email);
    const userBD = await User.findOne({ where: { email: normalizedEmail } });
    if (userBD) {
      return res.status(409).json({ msg: "The email already exists" });
    }
    infoUser.email = normalizedEmail;

    if (!regexName.test(name)) {
      return res
        .status(400)
        .json({ msg: "The name is invalid (only letters and spaces allowed)" });
    }
    if (name.length < 2 || name.length > 15) {
      return res
        .status(400)
        .json({ msg: "Name must be between 2 and 15 characters" });
    }
    infoUser.name = name;

    if (!regexName.test(lastname)) {
      return res.status(400).json({
        msg: "The lastname is invalid (only letters and spaces allowed)",
      });
    }
    if (lastname.length < 2 || lastname.length > 15) {
      return res
        .status(400)
        .json({ msg: "Lastname must be between 2 and 15 characters" });
    }
    infoUser.lastname = lastname;

    if (!regexPassword.test(password)) {
      return res.status(400).json({
        msg: "Password must be between 8-20 characters and include at least one uppercase letter, one lowercase letter, one number, and one symbol.",
      });
    }
    const passwordHash = await encrypt(password);
    infoUser.password = passwordHash;

    const user = await User.create(infoUser);
    return res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ msg: `Internal server error: ${error.message}` });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.destroy({
      where: {
        id: `${id}`,
      },
    });
    if (!deletedUser) return res.json({ msg: "Username does not exist" });
    return res.json({ msg: "User Deleted" });
  } catch (error) {
    return res.json({ msg: `Error 404 - ${error}` });
  }
};

const findUser = async (name) => {
  const results = await User.findAll({
    where: {
      name: { [Op.iLike]: `%${name}%` },
    },
  });
  return results;
};

const recuperarPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ msg: "Usuario no encontrado", success: false });
    }

    if (!user.status) {
      return res
        .status(403)
        .json({ msg: "El usuario esta baneado", success: false });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await enviarPass(email, code);

    res
      .status(200)
      .json({ msg: "Correo enviado con exito", pass: code, success: true });
  } catch (error) {
    console.error("Error en el cambio de contraseña:", error);
    res.status(500).json({
      msg: "Error en el servidor. No se pudo enviar el correo.",
      success: false,
    });
  }
};

module.exports = {
  putUser,
  getUsers,
  getUserId,
  loginUser,
  postUsers,
  deleteUser,
  postUserGoogle,
  loginGoogle,
  googleAuth,
  findUser,
  recuperarPassword,
};
