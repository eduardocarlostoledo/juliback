const { Cart, Product, User } = require("../db");

const addProductCart = async (product, user) => {
  try {
    if (!product || !user) {
      throw new Error(
        "Datos incompletos: se requiere un producto y un usuario."
      );
    }

    const [prod, esUsuario] = await Promise.all([
      Product.findOne({ where: { name: product.name } }),
      User.findOne({ where: { id: user } }),
    ]);

    if (!prod) throw new Error("El producto no existe.");
    if (!esUsuario) throw new Error("El usuario no está registrado.");

    let tieneCarrito = await Cart.findOne({ where: { cartUserId: user } });
    //console.log("Carrito encontrado:", tieneCarrito?.cartProducts?.length);

    if (!tieneCarrito) {
      tieneCarrito = await Cart.create({
        cartUserId: esUsuario.id,
        cartProducts: [{ id: prod.id, name: prod.name, price: prod.price, image: prod.image,  amount: 1 }],
        order: Date.now(),
      });
      //console.log("Carrito creado", tieneCarrito.cartProducts);
    } else {
      //console.log("Else, tiene carrito Carrito encontrado:", tieneCarrito.cartProducts);    
      
      let existingProducts = Array.isArray(tieneCarrito.cartProducts)
        ? [...tieneCarrito.cartProducts]
        : [];

      const updatedProducts = existingProducts.map((product) =>
        product.id === prod.id
          ? { ...product, amount: product.amount + 1 }
          : product
      );

      // Si el producto no existe en el carrito, lo agregamos
      const isProductInCart = existingProducts.some(
        (product) => product.name === prod.name
      );

      if (!isProductInCart) {
        updatedProducts.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, amount: 1 });
      }

      // Actualizar carrito en la base de datos
      await tieneCarrito.update({ cartProducts: updatedProducts });

      //console.log("Productos en el carrito después de actualizar:",updatedProducts;

      // console.log(
      //   "Productos en el carrito antes de actualizar:",
      //   existingProducts
      // );
      await tieneCarrito.update({ cartProducts: updatedProducts });

   
    }

    return tieneCarrito;
  } catch (error) {
    console.error("Error en addProductCart:", error.message);
    throw error;
  }
};

const getProductsCart = async () => {
  //console.log("getProductsCart");
  try {
    const productsCart = await Cart.findAll({ order: [["order", "ASC"]] });
    return productsCart;
  } catch (error) {
    console.error("No se han encontrado datos:", error.message);
    throw new Error("Error al obtener los carritos");
  }
};

const getCarritoDeUsuario = async (userId) => {
  //  console.log("2 getCarritoDeUsuario");
  try {
    let tieneCarrito = await Cart.findOne({ where: { cartUserId: userId } });

    if (!tieneCarrito) {
      throw new Error("El usuario no tiene un carrito activo.");
    }

    // Convertir cartProducts a JSON si viene como string
    if (typeof tieneCarrito.cartProducts === "string") {
      tieneCarrito.cartProducts = JSON.parse(tieneCarrito.cartProducts);
    }

    //console.log("3 getCarritoDeUsuario", tieneCarrito.cartProducts);
    return tieneCarrito;
  } catch (error) {
    console.error("Error en getCarritoDeUsuario:", error.message);
    throw new Error("Hubo un error al solicitar la información del carrito");
  }
};

const deleteProductCart = async (prodId, userId) => {
  try {
    //console.log(prodId, userId, "deleteProductCart");
    if (!prodId || !userId) {
      throw new Error("El ID del producto o del usuario no está definido.");
    }

    const tieneCarrito = await Cart.findOne({ where: { cartUserId: userId } });
    if (!tieneCarrito)
      throw new Error("El usuario no posee carritos para eliminar");

    let productosEnCarrito = tieneCarrito.cartProducts;
    const productIndex = productosEnCarrito.findIndex(
      (item) => item.id === prodId
    );

    if (productIndex === -1)
      throw new Error("El producto no está en el carrito");

    if (productosEnCarrito[productIndex].amount > 1) {
      productosEnCarrito[productIndex].amount -= 1;
    } else {
      productosEnCarrito.splice(productIndex, 1);
    }

    await tieneCarrito.update({ cartProducts: productosEnCarrito });

    return "Se ha modificado el carrito";
  } catch (error) {
    console.error("Error en deleteProductCart:", error.message);
    throw error;
  }
};

const deleteAllCart = async (userId) => {
  try {
    //console.log(userId);
    const tieneCarrito = await Cart.findOne({ where: { cartUserId: userId } });
    if (!tieneCarrito) throw new Error("No hay carrito para este usuario");

    await Cart.destroy({ where: { cartUserId: userId } });
    return "El carrito se eliminó";
  } catch (error) {
    console.error("Error eliminando el carrito:", error.message);
    throw new Error("Ha surgido un inconveniente en la base de datos");
  }
};

module.exports = {
  deleteAllCart,
  getProductsCart,
  addProductCart,
  deleteProductCart,
  getCarritoDeUsuario,
};
