const { Product, Type, Brand } = require("../db");
const { Op, fn, col, where } = require("sequelize");
const { uploadImages, deleteImage } = require("../utils/cloudinary");
const fs = require("fs-extra");

const normalizeArrayField = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.map((item) => String(item).trim()).filter(Boolean))];
      }
    } catch (error) {
      // Si no es JSON valido seguimos con parsing plano.
    }

    return [
      ...new Set(
        trimmed
          .split(/,|\n|\|/)
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
};

const normalizeStoredGallery = (product) => {
  const images = Array.isArray(product.images) ? product.images : [];
  const legacyImage = product.image ? [product.image] : [];
  const gallery = images.length ? images : legacyImage;

  return gallery.filter(Boolean);
};

const mapProductResponse = (product, includeReviews = false) => {
  const gallery = normalizeStoredGallery(product);
  const primaryImage = gallery[0] || null;

  return {
    id: product.id,
    name: product.name,
    image: primaryImage?.secure_url || null,
    images: gallery.map((image) => image?.secure_url).filter(Boolean),
    imageGallery: gallery,
    price: product.price,
    description: product.description,
    type: product.type?.name,
    brand: product.brand?.name,
    info_adicional: product.info_adicional,
    colors: Array.isArray(product.colors) ? product.colors : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    stock: product.stock,
    status: product.status,
    ...(includeReviews
      ? {
          reviews: product.reviews,
          calification: product.calification,
        }
      : {}),
  };
};

const normalizeFileInput = (fileInput) => {
  if (!fileInput) {
    return [];
  }

  return Array.isArray(fileInput) ? fileInput : [fileInput];
};

const cleanupTempFiles = async (files = []) => {
  await Promise.all(
    files
      .filter((file) => file?.tempFilePath)
      .map((file) => fs.remove(file.tempFilePath))
  );
};

const uploadProductGallery = async (files = []) => {
  if (!files.length) {
    return [];
  }

  const uploads = await uploadImages(files.map((file) => file.tempFilePath));

  return uploads.map((result) => ({
    public_id: result.public_id,
    secure_url: result.secure_url,
  }));
};

const deleteProductGallery = async (product) => {
  const gallery = normalizeStoredGallery(product);
  const publicIds = [...new Set(gallery.map((image) => image?.public_id).filter(Boolean))];

  await Promise.all(publicIds.map((publicId) => deleteImage(publicId)));
};

const postTypeProductForAdmin = async (name) => {
  try {
    const [typeProduct] = await Type.findOrCreate({
      where: { name },
      defaults: { name },
    });
    return typeProduct;
  } catch (error) {
    throw new Error("Error creating product type: " + error.message);
  }
};

const postBrandProductForAdmin = async (name) => {
  try {
    const [brandProduct] = await Brand.findOrCreate({
      where: { name },
      defaults: { name },
    });
    return brandProduct;
  } catch (error) {
    throw new Error("Error creating product brand: " + error.message);
  }
};

const getTypeProducts = async () => {
  try {
    return await Type.findAll();
  } catch (error) {
    throw new Error("Error retrieving product by Type: " + error.message);
  }
};

const getBrandProducts = async () => {
  try {
    return await Brand.findAll();
  } catch (error) {
    throw new Error("Error retrieving products by brand: " + error.message);
  }
};

const getProductsByName = async (productName) => {
  try {
    const products = await Product.findAll({
      include: [Type, Brand],
      where: {
        name: {
          [Op.iLike]: `%${productName}%`,
        },
      },
    });

    return products
      .filter((product) => product.status === true)
      .map((product) => mapProductResponse(product));
  } catch (error) {
    throw new Error("Error retrieving product by Name: " + error.message);
  }
};

const getProductsByNameForAdmin = async (productName) => {
  try {
    const products = await Product.findAll({
      include: [Type, Brand],
      where: {
        name: {
          [Op.iLike]: `%${productName}%`,
        },
      },
    });

    return products.map((product) => mapProductResponse(product));
  } catch (error) {
    throw new Error("Error retrieving product by Name: " + error.message);
  }
};

const getProducts = async () => {
  try {
    const allProducts = await Product.findAll({ include: [Type, Brand] });

    return allProducts
      .filter((product) => product.status === true)
      .map((product) => mapProductResponse(product));
  } catch (error) {
    throw new Error("Error retrieving products: " + error.message);
  }
};

const getProductsForAdmin = async () => {
  try {
    const allProducts = await Product.findAll({ include: [Type, Brand] });
    return allProducts.map((product) => mapProductResponse(product));
  } catch (error) {
    throw new Error("Error retrieving products: " + error.message);
  }
};

const getProductName = async (productName) => {
  try {
    const normalizedProductName = String(productName || "").trim();
    const products = await Product.findAll({
      include: [Type, Brand],
      where: where(fn("trim", col("Product.name")), {
        [Op.iLike]: normalizedProductName,
      }),
    });

    return products
      .filter((product) => product.status === true)
      .map((product) => mapProductResponse(product, true));
  } catch (error) {
    throw new Error("Error retrieving product by name: " + error.message);
  }
};

const postProduct = async (product, imageInput) => {
  const {
    name,
    price,
    type,
    brand,
    description,
    info_adicional,
    colors,
    sizes,
    stock,
  } = product;
  const imageFiles = normalizeFileInput(imageInput);

  if (
    !name ||
    !price ||
    !type ||
    !brand ||
    !description ||
    !imageFiles.length ||
    !stock
  ) {
    throw new Error("Mandatory data missing");
  }

  try {
    const [typeData] = await Type.findOrCreate({
      where: { name: type },
      defaults: { name: type },
    });
    const [brandData] = await Brand.findOrCreate({
      where: { name: brand },
      defaults: { name: brand },
    });

    const uploadedGallery = await uploadProductGallery(imageFiles);

    const newProduct = await Product.create({
      name,
      price,
      description,
      image: uploadedGallery[0] || null,
      images: uploadedGallery,
      typeId: typeData.id,
      brandId: brandData.id,
      info_adicional,
      colors: normalizeArrayField(colors),
      sizes: normalizeArrayField(sizes),
      stock,
    });

    await cleanupTempFiles(imageFiles);

    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [Type, Brand],
    });

    return mapProductResponse(createdProduct);
  } catch (error) {
    await cleanupTempFiles(imageFiles);
    throw new Error("Error creating product: " + error.message);
  }
};

const putProduct = async (id, product, imageInput) => {
  const productToUpdate = await Product.findByPk(id, { include: [Type, Brand] });
  if (!productToUpdate) throw Error("El producto que desea actualizar no existe");
  if (!product && !imageInput) throw Error("No se envio ningun dato para actualizar");

  const {
    name,
    price,
    type,
    brand,
    description,
    info_adicional,
    colors,
    sizes,
    stock,
  } = product;
  const imageFiles = normalizeFileInput(imageInput);

  try {
    if (imageFiles.length) {
      const uploadedGallery = await uploadProductGallery(imageFiles);
      await deleteProductGallery(productToUpdate);

      await Product.update(
        {
          image: uploadedGallery[0] || null,
          images: uploadedGallery,
        },
        { where: { id } }
      );

      await cleanupTempFiles(imageFiles);
    }

    if (type) {
      const [newType] = await Type.findOrCreate({ where: { name: type } });
      await Product.update({ typeId: newType.id }, { where: { id } });
    }

    if (brand) {
      const [newBrand] = await Brand.findOrCreate({ where: { name: brand } });
      await Product.update({ brandId: newBrand.id }, { where: { id } });
    }

    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (price !== undefined) fieldsToUpdate.price = price;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (info_adicional !== undefined)
      fieldsToUpdate.info_adicional = info_adicional;
    if (colors !== undefined) fieldsToUpdate.colors = normalizeArrayField(colors);
    if (sizes !== undefined) fieldsToUpdate.sizes = normalizeArrayField(sizes);
    if (stock !== undefined) fieldsToUpdate.stock = stock;

    if (Object.keys(fieldsToUpdate).length) {
      await Product.update(fieldsToUpdate, { where: { id } });
    }

    const updatedProduct = await Product.findByPk(id, { include: [Type, Brand] });
    return mapProductResponse(updatedProduct, true);
  } catch (error) {
    await cleanupTempFiles(imageFiles);
    throw new Error(error.message);
  }
};

const banOrUnban = async (id) => {
  const { status } = await Product.findByPk(id);
  await Product.update({ status: !status }, { where: { id } });
  return await Product.findByPk(id);
};

const BuildSearch = async (socket) => {
  try {
    const products = await Product.findAll({
      include: [Type, Brand],
      where: {
        info_adicional: socket,
      },
    });

    return products
      .filter((product) => product.status === true)
      .map((product) => mapProductResponse(product));
  } catch (error) {
    throw new Error("Error retrieving products by brand: " + error.message);
  }
};

const putReview = async (productId, review) => {
  const product = await Product.findByPk(productId);

  if (!product) throw Error("The product not exists");

  const totalReviews = product.reviews.length + 1;
  const totalCalifications =
    product.reviews.reduce((acc, currentReview) => acc + currentReview.calification, 0) +
    review.calification;

  await product.update({
    reviews: [...product.reviews, review],
    calification: (totalCalifications / totalReviews).toFixed(1),
  });

  return "The review was added";
};

const deleteProductImageByIndex = async (productId, imageIndex) => {
  const product = await Product.findByPk(productId, { include: [Type, Brand] });
  if (!product) throw Error("El producto no existe");

  const gallery = normalizeStoredGallery(product);
  const index = Number(imageIndex);

  if (index < 0 || index >= gallery.length) {
    throw Error("Índice de imagen inválido");
  }

  const imageToDelete = gallery[index];
  if (imageToDelete?.public_id) {
    await deleteImage(imageToDelete.public_id);
  }

  const updatedGallery = gallery.filter((_, i) => i !== index);

  await Product.update(
    {
      image: updatedGallery[0] || null,
      images: updatedGallery,
    },
    { where: { id: productId } }
  );

  const updatedProduct = await Product.findByPk(productId, { include: [Type, Brand] });
  return mapProductResponse(updatedProduct, true);
};

module.exports = {
  postProduct,
  getProducts,
  getProductName,
  getProductsByName,
  getBrandProducts,
  getTypeProducts,
  putProduct,
  BuildSearch,
  putReview,
  banOrUnban,
  getProductsForAdmin,
  getProductsByNameForAdmin,
  postBrandProductForAdmin,
  postTypeProductForAdmin,
  deleteProductImageByIndex,
};
