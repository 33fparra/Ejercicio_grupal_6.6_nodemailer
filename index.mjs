import express from "express";
import hbs from "hbs";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import https from "https";
 
//recuperar ruta raiz
import { dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.set("view engine", "hbs");
app.use(express.static("public"));
hbs.registerPartials(__dirname + "/views/partials");
// Middleware para analizar el cuerpo de la solicitud
app.use(bodyParser.json({limit: '25mb', extended: true}));
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true}));

app.get("/", (req, res) => {
  res.render("index");

});

app.post("/enviar-mail", async (req, res) => {
  const asunto = req.body.asunto;
  const mensaje = req.body.mensaje;
  const destinatarios = req.body.correos;
  let correos = destinatarios.split(",");

  try {
    const data = await consultarApi();
    console.log(data);
    enviarMail(asunto, mensaje, correos, data);
    res.send("<h1 style='margin-top:70px !important; text-align:center;'>Correo enviado exitosamente!</h1>");
    
  } catch (error) {
    console.error("Error al consumir API o enviar el correo:", error);
    res.status(500).send("Error al enviar el correo.");
  }
});

 app.listen(3000, () => {
    console.log("Servidor en puerto 3000");
 });

 function consultarApi() {
  return new Promise((resolve, reject) => {
    https.get("https://mindicador.cl/api", function (res) {
      res.setEncoding("utf-8");
      let data = "";

      res.on("data", function (chunk) {
        data += chunk;
      });

      res.on("end", function () {
        try {
          const dailyIndicators = JSON.parse(data);
          resolve(dailyIndicators);
        } catch (error) {
          reject("Error al parsear la respuesta de la API.");
        }
      });
    }).on("error", function (err) {
      reject("Error al consumir la API.");
    });
  });
}

const enviarMail = (asunto, mensaje, correos, data) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
    user: 'dimensiones4@gmail.com',  //aca coloca tu correo y luego para ver la configuracion de gmail mira el siguiente tutorial  https://www.youtube.com/watch?v=KjheexBLY4A
    pass: 'qbuvkzhmdnwthvci',  //esta es la contrasena de aplicaiones de este correo que uso, no tiene nada provado, asi que no importa que sea publica, aunque estos datos deberian ir en .env
    },
  });

  correos.forEach((correo) => {
    const mailOptions = {
      from: "dimensiones4@gmail.com",
      to: correo,
      subject: asunto,
      html: `<div class="">${mensaje} <br> <br>
      <p>El valor del dolar es: ${data.dolar.valor}</p><br>
      <p>El valor del euro es: ${data.euro.valor}</p><br>
      <p>El valor del uf de hoy es: ${data.uf.valor}</p><br>
      <p>El valor de la UTM es: ${data.utm.valor}</p></div>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email enviado a " + correo + ": " + info.response);
      }
    });
  });
};

