const { Router } = require('express');


const {
  postProduct,
  getProducts,
  getProductName,
  getProductsByName,
  getBrandProducts,
  getTypeProducts,
  BuildSearch,
  putReview,
  putProduct,
  banOrUnban,
  getProductsForAdmin,
  getProductsByNameForAdmin,  postBrandProductForAdmin,
  postTypeProductForAdmin
} = require('../controllers/productController');
//const { getUserById } = require('../controllers/usersController'); // Suponiendo que tienes un método para obtener usuario

// Importación correcta
const { verificaToken } = require("../helpers/verificaToken.js");
const { verifyAdmin } = require("../helpers/verifyAdmin.js");

console.log("check midlewares", verificaToken, verifyAdmin)

const productRouter = Router();


// Ruta POST de productos, solo puede ser usada por administradores
productRouter.post('/', 
  verificaToken, verifyAdmin, 
  async (req, res) => {
  try {
    const product = req.body;
    const newProduct = await postProduct(product, req.files?.image); 
    res.status(201).send({ status: 'Producto Creado en la Base de Datos', data: newProduct });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Ruta PUT para actualizar un producto
productRouter.put('/:id', 
  verificaToken, verifyAdmin, 
  async (req, res) => {    
  let image = req.files ? req.files.image : false;
  try {
    console.log("ruta put product", req.params.id, req.body, image)
    const updateProduct = await putProduct(req.params.id, req.body, image);
    res.status(200).json(updateProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET para realizar una búsqueda avanzada de productos
productRouter.get('/BuildSearch', async (req, res) => {
  try {
    const { socket, type } = req.query;
    const products = await BuildSearch(socket, type);
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET para obtener todos los tipos de productos
productRouter.get('/types', async (req, res) => {
  try {
    const products = await getTypeProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta POST para crear un nuevo tipo de producto (solo administradores)
productRouter.post('/types', 
  verificaToken , verifyAdmin, 
  async (req, res) => {
  const { name } = req.body;
  try {
    const postProducts = await postTypeProductForAdmin( name );
    res.status(200).json(postProducts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET para obtener todas las marcas de productos
productRouter.get('/brands', async (req, res) => {
  try {
    const products = await getBrandProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta POST para crear una nueva marca de producto (solo administradores)
productRouter.post('/brands', 
  verificaToken , verifyAdmin, 
  async (req, res) => {
  const { name } = req.body;
  try {
    const postProducts = await postBrandProductForAdmin( name );
    res.status(200).json(postProducts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET de productos con o sin filtro por nombre
productRouter.get('/', async (req, res) => {
  try {
    const products = req.query.name
      ? await getProductsByName(req.query.name)
      : await getProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET para administradores con o sin filtro por nombre
productRouter.get('/ForAdmin', 
  verificaToken, verifyAdmin, 
  async (req, res) => {
  try {
    const products = req.query.name
      ? await getProductsByNameForAdmin(req.query.name)
      : await getProductsForAdmin();
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta GET para obtener un producto por nombre exacto
productRouter.get('/:name', async (req, res) => {
  try {
    const result = await getProductName(req.params.name);
    if (result.length > 0) {
      res.status(200).json({ data: result, message: 'Producto solicitado' });
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para añadir review
productRouter.put('/review/:id', 
  verificaToken,  
  async (req, res) => {
  try {
    const { id } = req.params;
    const result = await putReview(id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para banear o desbanear producto
productRouter.put('/ban/:id', 
  verificaToken, verifyAdmin, 
  async (req, res) => {
  try {
    const { id } = req.params;
    const result = await banOrUnban(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = { productRouter };
