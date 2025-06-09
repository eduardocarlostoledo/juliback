const { Product, User, Type, Brand } = require("../db");
const { getProducts } = require("./productController")


const filterByPage = async (numPage,type,brand,price) => {
    try {
        let products = await getProducts()
        type ? products = await products.filter(p => p.type == type) : null
        brand ? products = await products.filter(p => p.brand == brand) : null
        
        if(price) {
            //console.log(price)
            if(price == 'a') products = await products.sort((a,b) => {return a.price - b.price})
            if(price == 'd') products = await products.sort((a,b) => {return a.price + b.price})
        }

        const maxIndex = numPage * 9
        const minIndex = maxIndex - 9
        const result = products.slice(minIndex, maxIndex)
        return result
    } catch (error) {
        throw Error(error)
    }
}



module.exports = {filterByPage}