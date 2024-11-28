const express = require("express")
const cors = require("cors")
const mysql = require("mysql2")
const jwt = require("jsonwebtoken")

const app = express()

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY } = process.env

app.use(cors())
app.use(express.json())

app.post("/register", (request, response) => { //Rota de registro do usuário
    const user = request.body.user

    const searchCommand = `
        SELECT * FROM Users
        WHERE name = ?
    `

    db.query(searchCommand, [user.name], (error, data) => {
        if (error) {
            console.log(error)
            return
        }

        if (data.length !== 0) {
            response.json({ message: "Já existe um usuário com esse nome. Tente outro nome!", userExists: true })
            return
        }

        const insertCommand = `
            INSERT INTO Users(name, password)
            VALUES (?, ?)
        `

        db.query(insertCommand, [user.name, user.password], (error) => {
            if (error) {
                console.log(error)
                return
            }

            response.json({ message: "Usuário castrado com sucesso!" })
        })
    })
})

app.post("/login", (request, response) => {
    const user = request.body.user

    const searchCommand = `
        SELECT * FROM Users
        WHERE name = ?
    `

    db.query(searchCommand, [user.name], (error, data) => {
        if (error) {
            console.log(error)
            return
        }

        if (data.length === 0) {
            response.json({ message: "Não existe nenhum usuário cadastrado com esse nome!" })
            return
        }

        if (user.password === data[0].password) {
            const name = user.name
            const id = data[0].id
            const namep = data[0].name
            

            const token = jwt.sign({ id, name, namep }, SECRET_KEY, { expiresIn: "1h" })
            response.json({ token, ok: true })
            return
        }

        response.json({ message: "Credenciais Inválidas! Tente novamente" })
    })
})

app.post("/verify", (request, response) => {
    const token = request.headers.authorization

    jwt.verify(token, SECRET_KEY, (error, decoded) => {
        if (error) {
            response.json({ message: "Token inválido! Efetue o login novamente." })
            return
        }


        response.json({ ok: true })
    })
})

app.get("/getname", (request, response) => {
    const token = request.headers.authorization

    const decoded = jwt.verify(token, SECRET_KEY)

    response.json({ name: decoded.name })
})

//Nao sei, copiei do benones e modifiquei algumas coisas
app.post("/save-score", (req, res) => {
    const token = req.headers.authorization;
    const { pontos } = req.body;

    try {
        // Decodificar o token JWT para obter o ID do usuário
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        // Atualizar a pontuação do usuário na tabela
        const updateScoreQuery = `
            UPDATE Users
            SET scores = ?
            WHERE id = ?
        `;

        db.query(updateScoreQuery, [pontos, userId], (err) => {
            if (err) {
                console.error("Erro ao salvar pontuação:", err);
                return res.status(500).json({ message: "Erro ao salvar pontuação!" });
            }
            res.status(200).json({ message: "Pontuação salva com sucesso!" });
        });
    } catch (error) {
        console.error("Erro ao processar token:", error);
        res.status(401).json({ message: "Token inválido ou expirado!" });
    }
});


//Nao sei, copiei do benones e modifiquei algumas coisas
app.get("/ranking", (req, res) => {
    const query = `
        SELECT name, scores
        FROM Users
        WHERE scores IS NOT NULL
        ORDER BY scores DESC
        LIMIT 10;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Erro ao buscar o ranking:", err);
            return res.status(500).json({ message: "Erro ao buscar o ranking" });
        }
        res.status(200).json(results);
    });
});

app.listen(3000, () => {
    console.log("servidor rodando na porta 3000!")
})

const db = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD
})