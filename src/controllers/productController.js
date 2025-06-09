const { Product, User, Type, Brand } = require("../db");
const {Op} = require('sequelize')
const {uploadImage, deleteImage}=require('../utils/cloudinary')
const fs = require('fs-extra');

const postTypeProductForAdmin = async (name) => {
  try {
    const [typeProduct] = await Type.findOrCreate({
      where: { name },
      defaults: { name }
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
      defaults: { name }
    });
    return brandProduct;
  } catch (error) {
    throw new Error("Error creating product brand: " + error.message);
  }
};

// Obtiene los tipos de productos de la BDD
const getTypeProducts = async() => {
  try {    
    const products = await Type.findAll();  
    return products;
  } catch (error) {
    throw new Error("Error retrieving product by Type: " + error.message);
  }
}

// Obtiene las marcas de la BDD

const getBrandProducts = async() => {
  try {
    const products = await Brand.findAll();
    return products;
  } catch (error) {
    throw new Error("Error retrieving products by brand: " + error.message);
  }
}

// Obtiene los productos si contienen la palabra que recibe por parametro (Para la busqueda)

const getProductsByName = async (productName) => {
  try {
    const products = await Product.findAll({
      include: [Type,Brand],
      where: {
        name: {
          [Op.iLike]: `%${productName}%`,
        },
      },
    });
    const filterBans = products.filter( product => product.status === true)
    const result = filterBans.map((p) => {
      return {
        id: p.id,
        name: p.name,
        image:p.image.secure_url,
        price:p.price,
        description: p.description,
        type: p.type.name,
        brand: p.brand.name,
        stock: p.stock,
        status:p.status
      }
    })
    return result;
  } catch (error) {
    throw new Error("Error retrieving product by Name: " + error.message);
  }
};

const getProductsByNameForAdmin = async (productName) => {
  try {
    const products = await Product.findAll({
      include: [Type,Brand],
      where: {
        name: {
          [Op.iLike]: `%${productName}%`,
        },
      },
    });
    const result = products.map((p) => {
      return {
        id: p.id,
        name: p.name,
        image:p.image.secure_url,
        price:p.price,
        description: p.description,
        type: p.type.name,
        brand: p.brand.name,
        stock: p.stock,
        status:p.status
      }
    })
    return result;
  } catch (error) {
    throw new Error("Error retrieving product by Name: " + error.message);
  }
};


//Obtiene todos los productos de la BDD

const getProducts = async () => {
    try {
      const allProducts = await Product.findAll({include: [Type,Brand]});
      const filterBans = allProducts.filter( product => product.status === true)
      const result = filterBans.map((p) => {
        return {
          id: p.id,
          name: p.name,
          image:p.image.secure_url,
          price:p.price,
          description: p.description,
          type: p.type.name,
          brand: p.brand.name,
          info_adicional: p.info_adicional,
          stock: p.stock,
          status:p.status
        }
      })
      return result;
    } catch (error) {
      throw new Error("Error retrieving products: " + error.message);
    }
  };

const getProductsForAdmin = async () => {
    try {
      const allProducts = await Product.findAll({include: [Type,Brand]});
      const result = allProducts.map((p) => {
        return {
          id: p.id,
          name: p.name,
          image:p.image.secure_url,
          price:p.price,
          description: p.description,
          type: p.type.name,
          brand: p.brand.name,
          info_adicional: p.info_adicional,
          stock: p.stock,
          status:p.status
        }
      })
      return result;
    } catch (error) {
      throw new Error("Error retrieving products: " + error.message);
    }
  };
  

// Obtiene los productos cuando tienen el nombre exactamente igual al que reciben por parametro (Sirve para la ruta Detail en el Front)

const getProductName = async (product) => {
  try {
    const products = await Product.findAll({include: [Type,Brand],where:{name:product}});
    const filterBans = products.filter( product => product.status === true)
    const result = filterBans.map((p) => {
      return {
        id: p.id,
        name: p.name,
        image:p.image.secure_url,
        price:p.price,
        description: p.description,
        type: p.type.name,
        brand: p.brand.name,        
        stock:p.stock,
        reviews:p.reviews,
        calification:p.calification,
        info_adicional:p.info_adicional,
        status:p.status
      }
    })
    if (result) return result;
    throw new Error("Product not found with exact name: " + product);
  } catch (error) {
    throw new Error("Error retrieving product by name: " + error.message);
  }
};



// Crea un producto en la BDD, esta accion sirve para testear. (Unicamente va a ser ejecutada por un administrador, no el usuario)
// const postProduct = async (product, image) => {
//   const { name, price, type, brand, description, info_adicional, stock } = product;
//   console.log(product.stock, "POST")
//   if (!name || !price || !type || !brand || !description || !image || !stock) {
//     throw new Error("Mandatory data missing");
//   }

//   try {
//     const [typeData, createdType] = await Type.findOrCreate({
//       where: { name: type },
//       defaults: { name: type }
//     });
//     console.log(typeData.name, "POST")

//     const [brandData, createdBrand] = await Brand.findOrCreate({
//       where: { name: brand },
//       defaults: { name: brand }
//     });
//     console.log(brandData.name, "POST")

//     const result = await uploadImage(image.tempFilePath);
//     console.log(result, "POSTIMAGE")

//     const newProduct = await Product.create({
//       name,
//       price,
//       description,
//       image: { public_id: result.public_id, secure_url: result.secure_url },
//       typeId: typeData.id,
//       brandId: brandData.id,
//       info_adicional,
//       stock,
//     });
//     console.log(newProduct, "POSTOK")

//     await fs.remove(image.tempFilePath);
//     console.log(product.stock, newProduct, "POSTOK")

//     return newProduct;
//   } catch (error) {
//     console.error(error);
//     throw new Error(error.message);
//   }
// };

const postProduct = async (product, image) => {
  //console.log("POST PRODUCT", product, image)
  const { name, price, type, brand, description, info_adicional, stock } = product;
  if (!name || !price || !type || !brand || !description || !image || !stock) {
    throw new Error("Mandatory data missing");
  }

  try {
    const [typeData] = await Type.findOrCreate({ where: { name: type }, defaults: { name: type } });
    const [brandData] = await Brand.findOrCreate({ where: { name: brand }, defaults: { name: brand } });

    const result = await uploadImage(image.tempFilePath);
    const newProduct = await Product.create({
      name,
      price,
      description,
      image: { public_id: result.public_id, secure_url: result.secure_url },
      typeId: typeData.id,
      brandId: brandData.id,
      info_adicional,
      stock,
    });

    await fs.remove(image.tempFilePath);
    return newProduct;
  } catch (error) {
    console.error(error);
    throw new Error("Error creating product: " + error.message);
  }
};


const putProduct = async (id,product, image) => {
  //console.log("PUT PRODUCT controller", id, product, image)
  const { name, price, type, brand, description,info_adicional, stock } = product;
  const productToUpdate=await Product.findByPk(id) 
  if(!productToUpdate) throw Error('El producto que desea actualizar no existe')
  if (!product && !image) throw Error('No se envió ningun dato para actualizar')

  if(image){
    //invoco la funcion para subir la imagen a cloudinary
    const result=await uploadImage(image.tempFilePath)
    deleteImage(productToUpdate.image.public_id)
    await Product.update({image:{public_id:result.public_id,secure_url:result.secure_url}}, { where: { id } })
    
    //borro la imagen de la carpeta uploads para que solo quede guardada en cloudinary
    await fs.remove(image.tempFilePath)
  }
  if(type){
    const [newType,created]=await Type.findOrCreate({where:{name:type}})
    const typeId = created ? newType.id : newType.dataValues.id;
    await Product.update({typeId}, { where: { id } })
  }

  if(brand){
    const [newBrand, created]=await Brand.findOrCreate({where:{name:brand}})
    const brandId= created ? newBrand.id : newBrand.dataValues.id;
    await Product.update({brandId}, { where: { id } })
  }

  await Product.update({name, price, description,info_adicional, stock }, { where: { id } })

  return await Product.findByPk(id);
}

const banOrUnban = async (id) => {
  const {status} = await Product.findByPk(id)

  await Product.update({status:!status}, { where: { id } })

  return await Product.findByPk(id);
}

const BuildSearch = async (socket) => {
  try {
    const products = await Product.findAll({
      include: [Type,Brand],
      where: {
        "info_adicional": socket,
      },
    });
    const filterBans = products.filter( product => product.status === true)
    const result = filterBans.map((p) => {
      return {
        id: p.id,
        name: p.name,
        image:p.image.secure_url,
        price:p.price,
        description: p.description,
        info_adicional: p.info_adicional,
        type: p.type.name,
        brand: p.brand.name,
        stock: p.stock,
        status:p.status
      }
    })
    return result;
  } catch (error) {
    throw new Error("Error retrieving products by brand: " + error.message);
  }
};

const putReview = async (productId,review) => {
  //console.log("PUT REVIEW", productId, review)
  //busco el producto con el id recibido por parametro
  let product = await Product.findByPk(productId);

  //si el producto no existe lanzo un error
  if(!product) throw Error("The product not exists");

  //obtengo la cantidad total de reviews
  const totalReviews=product.reviews.length + 1;

  //obtengo la suma total de calificaciones
  const totalCalifications=product.reviews.reduce((acc, review) => acc + review.calification, 0) + review.calification

  //actualizo el producto
  await product.update({
    reviews: [...product.reviews, review],
    calification: (totalCalifications / totalReviews).toFixed(1),
  });

  return "The review was added";
}

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
  postTypeProductForAdmin
};