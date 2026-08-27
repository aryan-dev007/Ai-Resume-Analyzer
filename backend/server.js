const app = require("./src/app")
const connectDB = require("./src/config/database")

require("dotenv").config()
connectDB();

const PORT =3000;
app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`)
})