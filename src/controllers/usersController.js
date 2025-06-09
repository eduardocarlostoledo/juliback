
const jwt = require('jsonwebtoken');
const { User } = require('../db')
const { encrypt, compare } = require('../helpers/bcrypt');
const { Op } = require("sequelize");
const { uploadImage, deleteImage } = require('../utils/cloudinary')
const fs = require('fs-extra');
const enviarPass = require('../mail/changePass')

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ msg: 'User not found', success: false });
    }

    const checkPassword = await compare(password, user.password);
    if (!checkPassword) {
      return res.json({ msg: 'Invalid password', success: false });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        admin: user.admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN } // Ejemplo: '1d' (1 día)
    );

    // Enviar el token junto con los datos del usuario
    res.status(200).json( {
      msg: 'Login successful',      
      user: {
        token,
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        image: user.image,
        phonenumber: user.phonenumber,
        country: user.country,
        city: user.city,
        email: user.email,
        admin: user.admin,
        status: user.status,
      },
      success: true,
    });
  } catch (error) {
    return res.json({ msg: `Error 404 - ${error.message}` });
  }
};

const loginGoogle = async (req, res) => {
  //console.log("login google", req.body)
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    //console.log(user)
    if (!user) {
      return res.json({ msg: 'User not found', success: false });
    }

    // Generar token JWT
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

    // Enviar el token y los datos del usuario
    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        token,
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        image: user.image,
        phonenumber: user.phonenumber,
        country: user.country,
        city: user.city,
        email: user.email,
        admin: user.admin,
        status: user.status,
      },
      success: true,
    });
  } catch (error) {
    return res.json({ msg: `Error 404 - ${error.message}` });
  }
};

//esta ruta se usa para consultar si el usuario existe....
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
    if (result) return result;
    throw new Error("User not found with ID: " + userId);
  } catch (error) {
    throw new Error("Error retrieving User by ID: " + error.message);
  }
};
const putUser = async (user, image, id) => {
  const {
    name,
    lastname,
    email,
    password,
    phonenumber,
    country,
    city,
    address,
    admin,
    status
  } = user;

  if (!user && !image) throw Error('User data missing');

  try {
    const fieldsToUpdate = {
      admin,
      status,
      name,
      lastname,
      email,
      phonenumber,
      country,
      city,
      address
    };

    // Si hay contraseña, hashearla y agregarla a los campos
    if (password) {
      const passwordHash = await encrypt(password);
      fieldsToUpdate.password = passwordHash;
    }

    // Si hay imagen, subir a Cloudinary y preparar campos
    if (image) {
      const userToUpdate = await User.findByPk(id);
      const result = await uploadImage(image.tempFilePath);

      if (userToUpdate.image?.public_id) {
        await deleteImage(userToUpdate.image.public_id);
      }

      fieldsToUpdate.image = {
        public_id: result.public_id,
        secure_url: result.secure_url
      };

      await fs.remove(image.tempFilePath);
    }

    const changeUser = await User.update(fieldsToUpdate, { where: { id } });
    return changeUser;

  } catch (error) {
    throw Error(error.message);
  }
};


const postUserGoogle = async (req, res) => {
  console.log("post user google", req.body)
  try {
    const { name, lastname, email, image } = req.body;
    if (!name || !lastname || !email) return res.json({ msg: 'Missing required fields', success: false });
    
    const userBD = await User.findOne({ where: { email: `${email}` } });
    if (userBD) {
    return res.json({ msg: 'The email already exists', success: false  });
    }

    const user = await User.create({
      name: name,
      lastname: lastname,
      email: email,
      image: { public_id: null, secure_url: image },
      password: "XDRWQDFF11asedfa123"
    });
    return res.json({ msg: `User create succesfully`, success: true, user });    

  } catch (error) {
    return res.json({ msg: `Error 404 - ${error}` });
  }
}

//registro de usuarios y verificacion de datos iniciales
const postUsers = async (req, res) => {
  const infoUser = {}
  const regexName = /^([a-zA-Z ]+)$/i;
  const regexPassword = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[a-zA-Z!#$%&? "])[a-zA-Z0-9!#$%&?]{8,20}$/
  const regexEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g

  try {
    const { name, lastname, email, password } = req.body;

    if (!name || !lastname || !password || !email) return res.json({ msg: 'Missing required fields' });


    if (email && email.length > 0 && email != "") {
      if (regexEmail.test(email)) {
        const userBD = await User.findOne({ where: { email: `${email}` } });
        if (userBD) {
          return res.json({ msg: 'The email already exists' });
        } else {
          infoUser.email = `${email}`
        }
      }
    }

    if (name && name.length > 0 && name != "") {
      if (regexName.test(name)) {
        infoUser.name = `${name}`
      } else {
        return res.json({ msg: 'The name is invalid' });
      }
    }

    if (lastname && lastname.length > 0 && lastname != "") {
      if (regexName.test(lastname)) {
        infoUser.lastname = `${lastname}`
      } else {
        return res.json({ msg: 'The lastname is invalid' });
      }
    }

    if (password && password.length > 0 && password != "") {
      if (regexPassword.test(password)) {
        const passwordHash = await encrypt(password);
        infoUser.password = `${passwordHash}`
      } else {
        return res.json({ msg: 'The password is invalid' });
      }
    }

    await User.create({
      name: name,
      lastname: lastname,
      password: infoUser.password,
      email: email,
    });
    return res.json({ msg: `User create succesfully` });
  } catch (error) {
    return res.json({ msg: `Error 404 - ${error}` });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await await User.destroy({
      where: {
        id: `${id}`
      }
    });
    if (!deletedUser) return res.json({ msg: 'Username does not exist' });
    return res.json({ msg: 'User Deleted' });
  } catch (error) {
    return res.json({ msg: `Error 404 - ${error}` });
  }
};

//Busco el User por query 
const findUser = async (name) => {

  const results = await User.findAll({
    where: {
      name: { [Op.iLike]: `%${name}%` },
    }
  });
  return results
}

//recuperar contraseña
const recuperarPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el email existe en la base de datos
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado', success: false });
    }

    // Verificar si el usuario está activo
    if (!user.status) {
      return res.status(403).json({ msg: 'El usuario está baneado', success: false });
    }

    // Generar un código de recuperación de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Enviar el correo con el código de recuperación
    await enviarPass(email, code);

    // Responder con éxito y el código generado
    res.status(200).json({ msg: 'Correo enviado con éxito', pass: code, success: true });

  } catch (error) {
    // Manejar errores y responder con un mensaje adecuado
    console.error('Error en el cambio de contraseña:', error);
    res.status(500).json({ msg: 'Error en el servidor. No se pudo enviar el correo.', success: false });
  }

}

module.exports = {
  putUser, getUsers, getUserId, loginUser, postUsers, deleteUser, postUserGoogle, loginGoogle, findUser, recuperarPassword
}