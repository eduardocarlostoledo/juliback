const { Router } = require('express');
const { filterByPage } = require('../controllers/filterController');

const filterRouter = Router();

filterRouter.get('/', async (req, res) => {
    try {
        const { page = 1, type, brand, price } = req.query; // Destructuramos y asignamos un valor por defecto a `page`
        //console.log("req query filters",  req.query)
        
        const result = await filterByPage(page, type, brand, price);
        
        if (result.length === 0) {
            return res.status(404).json("There's no products in the specified page");
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(404).json(error.message);
    }
});

module.exports = { filterRouter };
