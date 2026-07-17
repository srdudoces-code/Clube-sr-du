import {
    db,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where
} from "./firebase.js";

// ==========================
// CONFIGURAÇÕES GERAIS
// ==========================

const SENHA_ADMIN = "266426";
const METAS = [10, 20, 30, 40, 50];
const HORAS_EXPIRA_PREMIO_DIA = 48;
const DIAS_EXPIRA_MARCO = 7; // prazo padrão para resgatar prêmio de selos (ajustável aqui)
const LINK_INSTAGRAM_PADRAO = "https://instagram.com/sr_dudoces";
const LINK_GOOGLE_PADRAO = "";

const PREMIOS_DIARIOS_PADRAO = [
    "5% de desconto",
    "10% de desconto",
    "1 Brigadeiro",
    "1 Brownie",
    "1 Coxinha",
    "1 Bombom de morango"
];

// ==========================
// ELEMENTOS
// ==========================

const telas = {
    inicial: document.getElementById("telaInicial"),
    cadastro: document.getElementById("telaCadastro"),
    painel: document.getElementById("painelCliente"),
    adminLogin: document.getElementById("telaAdminLogin"),
    admin: document.getElementById("centralAdmin")
};

const modalCodigos = document.getElementById("modalCodigos");
const modalClientes = document.getElementById("modalClientes");
const modalPremios = document.getElementById("modalPremios");

const loginTelefone = document.getElementById("loginTelefone");
const btnEntrarCliente = document.getElementById("btnEntrarCliente");
const btnAbrirAdmin = document.getElementById("btnAbrirAdmin");

const cadNome = document.getElementById("cadNome");
const cadNascimento = document.getElementById("cadNascimento");
const btnConcluirCadastro = document.getElementById("btnConcluirCadastro");
const btnVoltarCadastro = document.getElementById("btnVoltarCadastro");

const painelSaudacao = document.getElementById("painelSaudacao");
const painelProgresso = document.getElementById("painelProgresso");
const painelSelosTexto = document.getElementById("painelSelosTexto");

const bannerMarco = document.getElementById("bannerMarco");
const marcoTexto = document.getElementById("marcoTexto");
const btnResgatarMarco = document.getElementById("btnResgatarMarco");

const inputCodigoCompra = document.getElementById("inputCodigoCompra");
const btnConfirmarCompra = document.getElementById("btnConfirmarCompra");

const roleta = document.getElementById("roleta");
const btnGirar = document.getElementById("btnGirar");
const premioDiaTexto = document.getElementById("premioDiaTexto");

const linkGoogle = document.getElementById("linkGoogle");
const linkInstagram = document.getElementById("linkInstagram");

const btnSairCliente = document.getElementById("btnSairCliente");

const adminSenha = document.getElementById("adminSenha");
const btnEntrarAdmin = document.getElementById("btnEntrarAdmin");
const btnVoltarAdminLogin = document.getElementById("btnVoltarAdminLogin");
const btnSairAdmin = document.getElementById("btnSairAdmin");

const btnCodigos = document.getElementById("btnCodigos");
const btnGerarCodigo = document.getElementById("btnGerarCodigo");
const btnFecharCodigos = document.getElementById("btnFecharCodigos");
const codigoGeradoBox = document.getElementById("codigoGeradoBox");
const codigoGerado = document.getElementById("codigoGerado");

const btnClientes = document.getElementById("btnClientes");
const btnFecharClientes = document.getElementById("btnFecharClientes");
const buscaCliente = document.getElementById("buscaCliente");
const listaClientes = document.getElementById("listaClientes");

const btnPremios = document.getElementById("btnPremios");
const btnSalvarPremios = document.getElementById("btnSalvarPremios");
const btnFecharPremios = document.getElementById("btnFecharPremios");

// ==========================
// ESTADO EM MEMÓRIA
// ==========================

let clienteAtual = null;   // { id: telefoneLimpo, ...dados do Firestore }
let configPremios = null;  // cache da config de prêmios/links
let todosClientes = [];
let girando = false;

// ==========================
// UTILITÁRIOS
// ==========================

function limparTelefone(fone) {

    return (fone || "").replace(/\D/g, "");

}

function aplicarMascara(input) {

    input.addEventListener("input", () => {

        let valor = input.value.replace(/\D/g, "");
        valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
        valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
        input.value = valor.substring(0, 15);

    });

}

aplicarMascara(loginTelefone);

function gerarCodigoAleatorio() {

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "";

    for (let i = 0; i < 6; i++) {

        codigo += chars.charAt(Math.floor(Math.random() * chars.length));

    }

    return codigo;

}

function hojeStr() {

    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

}

function horasDesde(dataIso) {

    if (!dataIso) return Infinity;
    return (Date.now() - new Date(dataIso).getTime()) / 1000 / 3600;

}

function formatarDataHora(dataIso) {

    const d = new Date(dataIso);
    return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

}

function mostrarTela(nome) {

    Object.values(telas).forEach(el => el.style.display = "none");
    telas[nome].style.display = "block";

}

async function carregarConfigPremios() {

    try {

        const dados = await getDoc(doc(db, "configuracoes", "premios"));
        configPremios = dados.exists() ? dados.data() : {};

    } catch (erro) {

        console.error(erro);
        configPremios = {};

    }

    return configPremios;

}

function textoPremioDiario(indice) {

    if (configPremios && configPremios["premioDiario" + indice]) {

        return configPremios["premioDiario" + indice];

    }

    return PREMIOS_DIARIOS_PADRAO[indice - 1];

}

function listaPremiosDiarios() {

    return [1, 2, 3, 4, 5, 6].map(textoPremioDiario);

}

function textoPremioMarco(marco) {

    if (configPremios && configPremios["premio" + marco]) {

        return configPremios["premio" + marco];

    }

    return marco === 50 ? "Prêmio especial! 🎉" : "Prêmio surpresa";

}

// ==========================
// LOGIN / CADASTRO
// ==========================

btnAbrirAdmin.onclick = () => {

    adminSenha.value = "";
    mostrarTela("adminLogin");

};

btnEntrarCliente.onclick = async () => {

    const foneLimpo = limparTelefone(loginTelefone.value);

    if (foneLimpo.length < 10) {

        alert("Digite um WhatsApp válido.");
        return;

    }

    try {

        const refCliente = doc(db, "clientes", foneLimpo);
        const snap = await getDoc(refCliente);

        if (snap.exists()) {

            clienteAtual = { id: foneLimpo, ...snap.data() };
            await abrirPainel();

        } else {

            cadNome.value = "";
            cadNascimento.value = "";
            mostrarTela("cadastro");

        }

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

btnVoltarCadastro.onclick = () => {

    mostrarTela("inicial");

};

btnConcluirCadastro.onclick = async () => {

    const foneLimpo = limparTelefone(loginTelefone.value);
    const nome = cadNome.value.trim();
    const nascimento = cadNascimento.value;

    if (!nome) {

        alert("Digite seu nome.");
        return;

    }

    try {

        const novoCliente = {

            nome: nome,
            telefone: loginTelefone.value.trim(),
            nascimento: nascimento,
            selosTotal: 0,
            marcoPendente: null,
            marcoPendenteExpira: null,
            ultimaCompraData: null,
            ultimaGiradaData: null,
            premioDoDia: null,
            premioDoDiaData: null,
            dataCadastro: new Date().toISOString()

        };

        await setDoc(doc(db, "clientes", foneLimpo), novoCliente);

        clienteAtual = { id: foneLimpo, ...novoCliente };

        alert("✅ Cadastro concluído! Bem-vindo(a) ao Clube Sr. Du.");

        await abrirPainel();

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

btnSairCliente.onclick = () => {

    clienteAtual = null;
    loginTelefone.value = "";
    mostrarTela("inicial");

};

// ==========================
// PAINEL DO CLIENTE
// ==========================

async function abrirPainel() {

    await carregarConfigPremios();
    await checarExpiracaoMarco();

    painelSaudacao.textContent = "Olá, " + clienteAtual.nome + "! 👋";

    atualizarProgresso();
    atualizarBannerMarco();
    atualizarPremioDia();
    atualizarLinks();

    mostrarTela("painel");

}

function atualizarProgresso() {

    const selos = clienteAtual.selosTotal || 0;
    const dentroDoCiclo = selos % 10;
    const percentual = dentroDoCiclo === 0 && selos > 0 ? 100 : (dentroDoCiclo / 10) * 100;

    painelProgresso.style.width = percentual + "%";

    if (selos >= 50) {

        painelSelosTexto.textContent = selos + " selos — você alcançou o prêmio especial! 🏆";

    } else {

        const proximaMeta = Math.ceil((selos + 1) / 10) * 10;
        painelSelosTexto.textContent = selos + " selos acumulados (próxima meta: " + proximaMeta + ")";

    }

}

async function checarExpiracaoMarco() {

    if (clienteAtual.marcoPendente && clienteAtual.marcoPendenteExpira) {

        if (new Date() > new Date(clienteAtual.marcoPendenteExpira)) {

            clienteAtual.marcoPendente = null;
            clienteAtual.marcoPendenteExpira = null;

            await updateDoc(doc(db, "clientes", clienteAtual.id), {

                marcoPendente: null,
                marcoPendenteExpira: null

            });

        }

    }

}

function atualizarBannerMarco() {

    if (clienteAtual.marcoPendente) {

        const marco = clienteAtual.marcoPendente;

        marcoTexto.textContent = "🎉 Você completou " + marco + " selos! Prêmio: " +
            textoPremioMarco(marco) + ". Resgate até " + formatarDataHora(clienteAtual.marcoPendenteExpira) + ".";

        bannerMarco.style.display = "block";

    } else {

        bannerMarco.style.display = "none";

    }

}

btnResgatarMarco.onclick = async () => {

    const marco = clienteAtual.marcoPendente;

    if (!marco) return;

    try {

        const updates = {

            marcoPendente: null,
            marcoPendenteExpira: null

        };

        if (marco === 50) {

            updates.selosTotal = 0;

        }

        await updateDoc(doc(db, "clientes", clienteAtual.id), updates);

        Object.assign(clienteAtual, updates);

        alert("🎁 Prêmio resgatado: " + textoPremioMarco(marco) + "\nMostre esta tela no balcão.");

        atualizarProgresso();
        atualizarBannerMarco();

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

// ==========================
// CONFIRMAR COMPRA (CÓDIGO DO CAIXA)
// ==========================

btnConfirmarCompra.onclick = async () => {

    const codigoDigitado = inputCodigoCompra.value.trim().toUpperCase();

    if (!codigoDigitado) {

        alert("Digite o código do caixa.");
        return;

    }

    try {

        const consulta = query(
            collection(db, "codigos"),
            where("codigo", "==", codigoDigitado)
        );

        const resultado = await getDocs(consulta);

        if (resultado.empty) {

            alert("❌ Código inválido.");
            return;

        }

        const docCodigo = resultado.docs[0];
        const dadosCodigo = docCodigo.data();

        if (dadosCodigo.usado) {

            alert("⚠️ Este código já foi utilizado.");
            return;

        }

        const novoTotal = (clienteAtual.selosTotal || 0) + 1;

        const updates = {

            selosTotal: novoTotal,
            ultimaCompraData: hojeStr()

        };

        // Se havia um marco pendente e ela comprou de novo sem resgatar, o marco anterior é perdido.
        if (clienteAtual.marcoPendente) {

            updates.marcoPendente = null;
            updates.marcoPendenteExpira = null;

        }

        // Novo marco atingido?
        if (METAS.includes(novoTotal)) {

            updates.marcoPendente = novoTotal;
            updates.marcoPendenteExpira = new Date(Date.now() + DIAS_EXPIRA_MARCO * 24 * 3600 * 1000).toISOString();

        }

        await updateDoc(doc(db, "clientes", clienteAtual.id), updates);

        await updateDoc(doc(db, "codigos", docCodigo.id), {

            usado: true,
            telefoneUsado: clienteAtual.telefone,
            dataUso: new Date().toISOString()

        });

        Object.assign(clienteAtual, updates);

        inputCodigoCompra.value = "";

        alert("✅ Compra confirmada! Você ganhou 1 selo.");

        atualizarProgresso();
        atualizarBannerMarco();
        atualizarPremioDia();

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

// ==========================
// PRÊMIO DO DIA (ROLETA)
// ==========================

function podeGirarHoje() {

    return clienteAtual.ultimaCompraData === hojeStr() &&
        clienteAtual.ultimaGiradaData !== hojeStr();

}

function atualizarPremioDia() {

    const jaGirouHoje = clienteAtual.ultimaGiradaData === hojeStr();
    const temPremioValido = jaGirouHoje && clienteAtual.premioDoDia &&
        horasDesde(clienteAtual.premioDoDiaData) < HORAS_EXPIRA_PREMIO_DIA;

    roleta.classList.remove("girando");

    if (temPremioValido) {

        roleta.textContent = "🎉";
        premioDiaTexto.style.display = "block";
        premioDiaTexto.textContent = "Prêmio de hoje: " + clienteAtual.premioDoDia +
            " — válido até " + formatarDataHora(new Date(new Date(clienteAtual.premioDoDiaData).getTime() + HORAS_EXPIRA_PREMIO_DIA * 3600 * 1000).toISOString()) +
            ". Mostre esta tela no balcão!";
        btnGirar.disabled = true;
        btnGirar.textContent = "Prêmio já resgatado hoje";

    } else if (jaGirouHoje) {

        roleta.textContent = "🎁";
        premioDiaTexto.style.display = "block";
        premioDiaTexto.textContent = "Você já girou hoje. Volte amanhã para um novo prêmio!";
        btnGirar.disabled = true;
        btnGirar.textContent = "Já usado hoje";

    } else if (podeGirarHoje()) {

        roleta.textContent = "🎁";
        premioDiaTexto.style.display = "none";
        btnGirar.disabled = false;
        btnGirar.textContent = "Girar";

    } else {

        roleta.textContent = "🔒";
        premioDiaTexto.style.display = "block";
        premioDiaTexto.textContent = "Confirme uma compra acima de R$50 hoje para desbloquear o giro.";
        btnGirar.disabled = true;
        btnGirar.textContent = "Girar";

    }

}

btnGirar.onclick = async () => {

    if (girando || !podeGirarHoje()) return;

    girando = true;
    btnGirar.disabled = true;
    roleta.classList.add("girando");

    const opcoes = listaPremiosDiarios();
    const emojisRoleta = ["🎁", "🍬", "🍫", "🧁", "🍪", "🥐"];

    let contagem = 0;
    const totalGiros = 14;

    const intervalo = setInterval(async () => {

        roleta.textContent = emojisRoleta[contagem % emojisRoleta.length];
        contagem++;

        if (contagem >= totalGiros) {

            clearInterval(intervalo);
            roleta.classList.remove("girando");

            const premioSorteado = opcoes[Math.floor(Math.random() * opcoes.length)];
            const agora = new Date().toISOString();

            const updates = {

                premioDoDia: premioSorteado,
                premioDoDiaData: agora,
                ultimaGiradaData: hojeStr()

            };

            try {

                await updateDoc(doc(db, "clientes", clienteAtual.id), updates);
                Object.assign(clienteAtual, updates);

            } catch (erro) {

                console.error(erro);
                alert("❌ " + erro.message);

            }

            girando = false;
            atualizarPremioDia();

        }

    }, 120);

};

// ==========================
// LINKS
// ==========================

function atualizarLinks() {

    linkGoogle.href = (configPremios && configPremios.linkGoogle) || LINK_GOOGLE_PADRAO || "#";
    linkInstagram.href = (configPremios && configPremios.linkInstagram) || LINK_INSTAGRAM_PADRAO;

}

// ==========================
// ADMIN — LOGIN
// ==========================

btnVoltarAdminLogin.onclick = () => {

    mostrarTela("inicial");

};

btnEntrarAdmin.onclick = () => {

    if (adminSenha.value.trim() !== SENHA_ADMIN) {

        alert("Senha incorreta.");
        return;

    }

    mostrarTela("admin");

};

btnSairAdmin.onclick = () => {

    mostrarTela("inicial");

};

// ==========================
// ADMIN — GERAR CÓDIGO
// ==========================

btnCodigos.onclick = () => {

    codigoGeradoBox.style.display = "none";
    modalCodigos.style.display = "flex";

};

btnFecharCodigos.onclick = () => {

    modalCodigos.style.display = "none";

};

btnGerarCodigo.onclick = async () => {

    try {

        const codigo = gerarCodigoAleatorio();

        await addDoc(collection(db, "codigos"), {

            codigo: codigo,
            usado: false,
            dataCriacao: new Date().toISOString()

        });

        codigoGerado.textContent = codigo;
        codigoGeradoBox.style.display = "block";

    } catch (erro) {

        console.error(erro);
        alert("❌ Erro ao gerar código: " + erro.message);

    }

};

// ==========================
// ADMIN — CLIENTES
// ==========================

btnClientes.onclick = async () => {

    modalClientes.style.display = "flex";
    buscaCliente.value = "";
    listaClientes.innerHTML = "<p>Carregando...</p>";

    try {

        const resultado = await getDocs(collection(db, "clientes"));

        todosClientes = [];

        resultado.forEach(docSnap => {

            todosClientes.push(docSnap.data());

        });

        renderizarClientes(todosClientes);

    } catch (erro) {

        console.error(erro);
        listaClientes.innerHTML = "<p>Erro ao carregar clientes.</p>";

    }

};

function renderizarClientes(lista) {

    if (lista.length === 0) {

        listaClientes.innerHTML = "<p>Nenhum cliente encontrado.</p>";
        return;

    }

    listaClientes.innerHTML = lista.map(c => {

        const selos = c.selosTotal || 0;
        const marco = c.marcoPendente ? " · 🎁 prêmio de " + c.marcoPendente + " pendente" : "";

        return "<div class='clienteItem'>" +
            "<strong>" + c.nome + "</strong>" +
            "<p>📱 " + c.telefone + "</p>" +
            "<p>🏅 " + selos + " selos" + marco + "</p>" +
            "</div>";

    }).join("");

}

buscaCliente.addEventListener("input", () => {

    const termo = buscaCliente.value.trim().toLowerCase();

    const filtrados = todosClientes.filter(c =>
        (c.nome || "").toLowerCase().includes(termo) ||
        (c.telefone || "").toLowerCase().includes(termo)
    );

    renderizarClientes(filtrados);

});

btnFecharClientes.onclick = () => {

    modalClientes.style.display = "none";

};

// ==========================
// ADMIN — PRÊMIOS E LINKS
// ==========================

btnPremios.onclick = async () => {

    modalPremios.style.display = "flex";

    await carregarConfigPremios();

    [1, 2, 3, 4, 5, 6].forEach(i => {

        document.getElementById("premioDiario" + i).value = textoPremioDiario(i);

    });

    [10, 20, 30, 40, 50].forEach(m => {

        document.getElementById("premio" + m).value = (configPremios["premio" + m]) || "";

    });

    document.getElementById("linkGoogleInput").value = configPremios.linkGoogle || "";
    document.getElementById("linkInstagramInput").value = configPremios.linkInstagram || LINK_INSTAGRAM_PADRAO;

};

btnFecharPremios.onclick = () => {

    modalPremios.style.display = "none";

};

btnSalvarPremios.onclick = async () => {

    try {

        const novaConfig = {

            linkGoogle: document.getElementById("linkGoogleInput").value.trim(),
            linkInstagram: document.getElementById("linkInstagramInput").value.trim()

        };

        [1, 2, 3, 4, 5, 6].forEach(i => {

            novaConfig["premioDiario" + i] = document.getElementById("premioDiario" + i).value.trim();

        });

        [10, 20, 30, 40, 50].forEach(m => {

            novaConfig["premio" + m] = document.getElementById("premio" + m).value.trim();

        });

        await setDoc(doc(db, "configuracoes", "premios"), novaConfig);

        configPremios = novaConfig;

        alert("✅ Prêmios e links salvos com sucesso!");

        modalPremios.style.display = "none";

    } catch (erro) {

        console.error(erro);
        alert("❌ Erro ao salvar: " + erro.message);

    }

};

console.log("✅ Clube Sr. Du carregado.");
