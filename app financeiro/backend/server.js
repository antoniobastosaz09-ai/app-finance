const { usuarios } = require('../data/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave-temporaria-desenvolvimento';

// CADASTRAR USUÁRIO - POST
exports.cadastrar = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos!'
            });
        }

        const existe = usuarios.find(u => u.email === email);

        if (existe) {
            return res.status(409).json({
                mensagem: 'E-mail já cadastrado!'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const usuario = {
            id: Date.now(),
            nome,
            email,
            senha: senhaHash
        };

        usuarios.push(usuario);

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
    }
};

// LOGIN - POST
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
        return res.status(401).json({
            mensagem: 'E-mail ou senha incorretos!'
        });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
        return res.status(401).json({
            mensagem: 'E-mail ou senha incorretos!'
        });
    }

    const token = jwt.sign(
        { id: usuario.id },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    res.json({
        mensagem: 'Login realizado com sucesso!',
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        }
    });
};

// LISTAR USUÁRIOS - GET
exports.listar = (req, res) => {
    const lista = usuarios.map(({ senha, ...usuario }) => usuario);

    res.json(lista);
};

// EXCLUIR USUÁRIO - DELETE
exports.excluir = (req, res) => {
    const id = Number(req.params.id);

    const index = usuarios.findIndex(u => u.id === id);

    if (index === -1) {
        return res.status(404).json({
            mensagem: 'Usuário não encontrado!'
        });
    }

    usuarios.splice(index, 1);

    res.json({
        mensagem: 'Usuário excluído com sucesso!'
    });
};