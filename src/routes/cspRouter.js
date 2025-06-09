const {Router} = require("express");
const cspRouter = Router();
const router = require("./index.js");

cspRouter.post("/csp-violation-report", (req, res) => {
    try {
        console.log("CSP Violation: ", req.body);
    res.status(200).json({ message: "CSP Violation Report Received" });
    } catch (error) {
        console.error("Error en csp-violation-report:", error.message);
        throw error;        
    }





})


module.exports = {cspRouter};