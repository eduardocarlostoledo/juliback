const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { 
  getProductsCart,
  addProductCart,
  deleteProductCart,
  deleteAllCart,
  getCarritoDeUsuario,
} = require('../controllers/cartController');
const { verificaToken } = require('../helpers/verificaToken');

const cartRouter = Router();

// Obtener todos los carritos
cartRouter.get('/', verificaToken, async (req, res) => {
  try {
    console.log("Obteniendo carritos");
    const productsCart = await getProductsCart();
    res.status(200).json(productsCart);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agregar producto al carrito
cartRouter.post('/', verificaToken, async (req, res) => {
  try {
    // console.log(req.body);
    const { product, user } = req.body;
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    const result = await addProductCart(product, user, decoded.userId);
    // console.log("ruta /post cart . Producto agregado al carrito:", result.cartProducts);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar producto del carrito
// cartRouter.delete('/:prodId', verificaToken, async (req, res) => {
//     try {
//       const { prodId } = req.params; // Extraer prodId de los parámetros de la ruta
//       const token = req.headers['authorization']?.split(' ')[1];
//       const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  
//       // Llamar a la función para eliminar el producto del carrito
//       const result = await deleteProductCart(prodId, decoded.userId);
//       res.status(200).json(result);
//     } catch (error) {
//       console.error("Error eliminando producto del carrito:", error);
//       res.status(400).json({ error: error.message });
//     }
//   });

// Obtener carrito de un usuario
cartRouter.get("/getcartclient/:userId", verificaToken, async (req, res) => {
    //console.log("1 getcartclient /getcartclient/:userId", req.params.userId);
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    const carritoCliente = await getCarritoDeUsuario(decoded.userId);

    if (!carritoCliente) {
      return res.status(404).json({ message: "No se encontró el carrito del cliente" });
    }
    //console.log("4 Carrito del cliente:/getcartclient/:userId", carritoCliente);
    res.status(200).json(carritoCliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar todo el carrito
cartRouter.delete('/deletecart', verificaToken, async (req, res) => {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  
      // Llamar a la función para eliminar todo el carrito
      await deleteAllCart(decoded.userId);
  
      // Devolver una respuesta exitosa
      res.status(200).json({ message: 'El carrito ha sido eliminado' });
    } catch (error) {
      console.error("Error eliminando el carrito:", error);
      res.status(400).json({ error: error.message });
    }
  });

module.exports = { cartRouter };