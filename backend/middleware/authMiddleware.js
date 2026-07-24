const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader);

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token);

    try {

        const decoded = jwt.verify(token, "skillsync_secret");
        console.log("Decoded User:", decoded);

        req.user = decoded;

        next();

    } catch (error) {

        console.log(error);


        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }

};

module.exports = verifyToken;