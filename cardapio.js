import {
    db,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where
} from "./firebase.js";

// ==========================
// CONFIGURAÇÕES GERAIS
// ==========================

const SENHA_ADMIN = "266426";

// ==========================
// ELEMENTOS
// ==========================

const barraCategorias = document.getElementById("barraCategorias");
const listaProdutosEl = document.getElementById("listaProdutos");
const destaqueSemanaEl = document.getElementById("destaqueSemana");

const linkEnderecoLoja = document.getElementById("linkEnderecoLoja");
const textoEnderecoLoja = document.getElementById("textoEnderecoLoja");

const btnAcompanharPedido = document.getElementById("btnAcompanharPedido");
const modalAcompanharPedido = document.getElementById("modalAcompanharPedido");
const acompanharTelefone = document.getElementById("acompanharTelefone");
const btnBuscarPedido = document.getElementById("btnBuscarPedido");
const statusPedidoBox = document.getElementById("statusPedidoBox");
const statusPedidoTexto = document.getElementById("statusPedidoTexto");
const linkAvaliarAposPedido = document.getElementById("linkAvaliarAposPedido");
const btnFecharAcompanharPedido = document.getElementById("btnFecharAcompanharPedido");

const barraCarrinho = document.getElementById("barraCarrinho");
const carrinhoResumoTexto = document.getElementById("carrinhoResumoTexto");
const btnVerCarrinho = document.getElementById("btnVerCarrinho");

const modalCarrinho = document.getElementById("modalCarrinho");
const itensCarrinhoEl = document.getElementById("itensCarrinho");
const subtotalCarrinhoEl = document.getElementById("subtotalCarrinho");
const btnIrParaEntrega = document.getElementById("btnIrParaEntrega");
const btnFecharCarrinho = document.getElementById("btnFecharCarrinho");

const modalCheckout = document.getElementById("modalCheckout");
const checkoutNome = document.getElementById("checkoutNome");
const checkoutTelefone = document.getElementById("checkoutTelefone");
const blocoEndereco = document.getElementById("blocoEndereco");
const checkoutBairro = document.getElementById("checkoutBairro");
const checkoutRua = document.getElementById("checkoutRua");
const checkoutComplemento = document.getElementById("checkoutComplemento");
const checkoutReferencia = document.getElementById("checkoutReferencia");
const blocoPix = document.getElementById("blocoPix");
const chavePixTexto = document.getElementById("chavePixTexto");
const blocoDinheiro = document.getElementById("blocoDinheiro");
const precisaTroco = document.getElementById("precisaTroco");
const trocoPara = document.getElementById("trocoPara");
const resumoPedidoFinal = document.getElementById("resumoPedidoFinal");
const btnFinalizarPedido = document.getElementById("btnFinalizarPedido");
const btnFecharCheckout = document.getElementById("btnFecharCheckout");

const modalConfirmacao = document.getElementById("modalConfirmacao");
const linkWhatsappPedido = document.getElementById("linkWhatsappPedido");
const btnNovoPedido = document.getElementById("btnNovoPedido");

const btnAbrirAdminCardapio = document.getElementById("btnAbrirAdminCardapio");
const telaAdminLoginCardapio = document.getElementById("telaAdminLoginCardapio");
const adminSenhaCardapio = document.getElementById("adminSenhaCardapio");
const btnEntrarAdminCardapio = document.getElementById("btnEntrarAdminCardapio");
const btnVoltarAdminLoginCardapio = document.getElementById("btnVoltarAdminLoginCardapio");
const centralAdminCardapio = document.getElementById("centralAdminCardapio");
const btnSairAdminCardapio = document.getElementById("btnSairAdminCardapio");

const btnAdminProdutos = document.getElementById("btnAdminProdutos");
const modalAdminProdutos = document.getElementById("modalAdminProdutos");
const listaAdminProdutosEl = document.getElementById("listaAdminProdutos");
const btnSalvarProduto = document.getElementById("btnSalvarProduto");
const btnFecharAdminProdutos = document.getElementById("btnFecharAdminProdutos");

const btnAdminBairros = document.getElementById("btnAdminBairros");
const modalAdminBairros = document.getElementById("modalAdminBairros");
const listaAdminBairrosEl = document.getElementById("listaAdminBairros");
const btnSalvarBairro = document.getElementById("btnSalvarBairro");
const btnFecharAdminBairros = document.getElementById("btnFecharAdminBairros");

const btnAdminPedidos = document.getElementById("btnAdminPedidos");
const modalAdminPedidos = document.getElementById("modalAdminPedidos");
const listaAdminPedidosEl = document.getElementById("listaAdminPedidos");
const btnFecharAdminPedidos = document.getElementById("btnFecharAdminPedidos");

const btnAdminConfigPagamento = document.getElementById("btnAdminConfigPagamento");
const modalConfigPagamento = document.getElementById("modalConfigPagamento");
const configChavePix = document.getElementById("configChavePix");
const configNomeTitularPix = document.getElementById("configNomeTitularPix");
const configWhatsappLoja = document.getElementById("configWhatsappLoja");
const configEnderecoLoja = document.getElementById("configEnderecoLoja");
const configLinkGoogle = document.getElementById("configLinkGoogle");
const btnSalvarConfigPagamento = document.getElementById("btnSalvarConfigPagamento");
const btnFecharConfigPagamento = document.getElementById("btnFecharConfigPagamento");

const produtoControlarEstoque = document.getElementById("produtoControlarEstoque");
const produtoEstoqueQtd = document.getElementById("produtoEstoqueQtd");

// ==========================
// ESTADO EM MEMÓRIA
// ==========================

let produtos = [];          // [{id, nome, descricao, preco, categoria, imagemUrl, disponivel}]
let bairros = [];           // [{id, nome, taxa}]
let carrinho = {};          // { produtoId: quantidade }
let configPagamento = {};   // { chavePix, nomeTitularPix, whatsappLoja }

// ==========================
// UTILITÁRIOS
// ==========================

function formatarMoeda(valor) {

    return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",");

}

function gerarIdProduto(id) {

    return "p_" + id;

}

produtoControlarEstoque.addEventListener("change", () => {

    produtoEstoqueQtd.style.display = produtoControlarEstoque.checked ? "block" : "none";

});

// ==========================
// CARREGAR PRODUTOS
// ==========================

async function carregarProdutos() {

    try {

        const resultado = await getDocs(collection(db, "produtos"));

        produtos = [];

        resultado.forEach(docSnap => {

            produtos.push({ id: docSnap.id, ...docSnap.data() });

        });

        renderizarCardapio();
        calcularDestaqueSemana();

    } catch (erro) {

        console.error(erro);
        listaProdutosEl.innerHTML = "<p class='carregandoTexto'>Erro ao carregar cardápio.</p>";

    }

}

async function calcularDestaqueSemana() {

    try {

        const seteDiasAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000);

        const resultado = await getDocs(collection(db, "pedidos"));
        const contagem = {};

        resultado.forEach(docSnap => {

            const pedido = docSnap.data();

            if (!pedido.dataCriacao || new Date(pedido.dataCriacao) < seteDiasAtras) return;
            if (!Array.isArray(pedido.itens)) return;

            pedido.itens.forEach(item => {

                if (!item.produtoId) return;

                contagem[item.produtoId] = (contagem[item.produtoId] || 0) + item.quantidade;

            });

        });

        const ids = Object.keys(contagem);

        if (ids.length === 0) {

            destaqueSemanaEl.style.display = "none";
            return;

        }

        ids.sort((a, b) => contagem[b] - contagem[a]);

        const produtoDestaque = produtos.find(p => p.id === ids[0] && p.disponivel !== false);

        if (!produtoDestaque) {

            destaqueSemanaEl.style.display = "none";
            return;

        }

        const imagem = produtoDestaque.imagemUrl
            ? "<img src='" + produtoDestaque.imagemUrl + "' class='produtoImg' alt='" + produtoDestaque.nome + "'>"
            : "<div class='produtoImgVazia'>🍬</div>";

        destaqueSemanaEl.innerHTML =
            "<div class='destaqueSemanaCard'>" +
                imagem +
                "<div>" +
                    "<div class='destaqueSelo'>🔥 Mais pedido da semana</div>" +
                    "<strong>" + produtoDestaque.nome + "</strong><br>" +
                    "<span>" + formatarMoeda(produtoDestaque.preco) + "</span>" +
                "</div>" +
            "</div>";

        destaqueSemanaEl.style.display = "block";

        destaqueSemanaEl.querySelector(".destaqueSemanaCard").onclick = () => {

            const alvo = document.getElementById("categoria-" + (produtoDestaque.categoria || "Outros").replace(/\s+/g, "-"));

            if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });

        };

    } catch (erro) {

        console.error(erro);
        destaqueSemanaEl.style.display = "none";

    }

}

function renderizarCardapio() {

    const disponiveis = produtos.filter(p => p.disponivel !== false);

    if (disponiveis.length === 0) {

        listaProdutosEl.innerHTML = "<p class='carregandoTexto'>Cardápio em breve! Volte mais tarde.</p>";
        barraCategorias.innerHTML = "";
        return;

    }

    const categorias = [];

    disponiveis.forEach(p => {

        const cat = p.categoria || "Outros";

        if (!categorias.includes(cat)) {

            categorias.push(cat);

        }

    });

    barraCategorias.innerHTML = categorias.map(cat =>
        "<button class='categoriaBtn' data-categoria='" + cat + "'>" + cat + "</button>"
    ).join("");

    barraCategorias.querySelectorAll(".categoriaBtn").forEach(btn => {

        btn.onclick = () => {

            const alvo = document.getElementById("categoria-" + btn.dataset.categoria.replace(/\s+/g, "-"));

            if (alvo) {

                alvo.scrollIntoView({ behavior: "smooth", block: "start" });

            }

        };

    });

    let html = "";

    categorias.forEach(cat => {

        const idAncora = "categoria-" + cat.replace(/\s+/g, "-");

        html += "<h2 class='categoriaTitulo' id='" + idAncora + "'>" + cat + "</h2>";

        disponiveis.filter(p => (p.categoria || "Outros") === cat).forEach(p => {

            html += renderizarProdutoCard(p);

        });

    });

    listaProdutosEl.innerHTML = html;

    disponiveis.forEach(p => {

        const idBtn = gerarIdProduto(p.id);
        const elMenos = document.getElementById(idBtn + "_menos");
        const elMais = document.getElementById(idBtn + "_mais");
        const elAdicionar = document.getElementById(idBtn + "_adicionar");

        if (elMais) elMais.onclick = () => alterarQuantidadeCarrinho(p.id, 1);
        if (elMenos) elMenos.onclick = () => alterarQuantidadeCarrinho(p.id, -1);
        if (elAdicionar) elAdicionar.onclick = () => alterarQuantidadeCarrinho(p.id, 1);

    });

    atualizarExibicaoQuantidades();

}

function renderizarProdutoCard(p) {

    const idBtn = gerarIdProduto(p.id);
    const esgotado = p.estoqueControlado && Number(p.estoqueQtd || 0) <= 0;

    const imagem = p.imagemUrl
        ? "<img src='" + p.imagemUrl + "' class='produtoImg' alt='" + p.nome + "'>"
        : "<div class='produtoImgVazia'>🍬</div>";

    const badgeEsgotado = esgotado ? "<span class='badgeEsgotado'>Esgotado</span>" : "";

    const acoes = esgotado
        ? "<span class='badgeEsgotado'>Esgotado</span>"
        : "<button class='btnAdicionar' id='" + idBtn + "_adicionar'>+ Adicionar</button>";

    return "<div class='produtoCard'>" +
        imagem +
        "<div class='produtoInfo'>" +
            "<h3>" + p.nome + "</h3>" +
            "<p>" + (p.descricao || "") + "</p>" +
            "<span class='produtoPreco'>" + formatarMoeda(p.preco) + "</span> " + badgeEsgotado +
        "</div>" +
        "<div class='produtoAcoes' id='" + idBtn + "_acoes'>" +
            acoes +
        "</div>" +
    "</div>";

}

function atualizarExibicaoQuantidades() {

    produtos.forEach(p => {

        const idBtn = gerarIdProduto(p.id);
        const acoesEl = document.getElementById(idBtn + "_acoes");

        if (!acoesEl) return;

        const esgotado = p.estoqueControlado && Number(p.estoqueQtd || 0) <= 0;
        const qtd = carrinho[p.id] || 0;

        if (esgotado && qtd === 0) {

            acoesEl.innerHTML = "<span class='badgeEsgotado'>Esgotado</span>";
            return;

        }

        if (qtd > 0) {

            acoesEl.innerHTML =
                "<button class='btnQtd' id='" + idBtn + "_menos'>−</button>" +
                "<span class='qtdTexto'>" + qtd + "</span>" +
                "<button class='btnQtd' id='" + idBtn + "_mais'>+</button>";

            document.getElementById(idBtn + "_menos").onclick = () => alterarQuantidadeCarrinho(p.id, -1);
            document.getElementById(idBtn + "_mais").onclick = () => alterarQuantidadeCarrinho(p.id, 1);

        } else {

            acoesEl.innerHTML = "<button class='btnAdicionar' id='" + idBtn + "_adicionar'>+ Adicionar</button>";
            document.getElementById(idBtn + "_adicionar").onclick = () => alterarQuantidadeCarrinho(p.id, 1);

        }

    });

    atualizarBarraCarrinho();

}

// ==========================
// CARRINHO
// ==========================

function alterarQuantidadeCarrinho(produtoId, delta) {

    const produto = produtos.find(p => p.id === produtoId);
    const atual = carrinho[produtoId] || 0;
    let novo = Math.max(0, atual + delta);

    if (produto && produto.estoqueControlado && delta > 0) {

        const limite = Number(produto.estoqueQtd || 0);

        if (novo > limite) {

            alert("Só temos " + limite + " unidade(s) desse produto em estoque.");
            novo = limite;

        }

    }

    if (novo === 0) {

        delete carrinho[produtoId];

    } else {

        carrinho[produtoId] = novo;

    }

    atualizarExibicaoQuantidades();

}

function totalItensCarrinho() {

    return Object.values(carrinho).reduce((soma, qtd) => soma + qtd, 0);

}

function subtotalCarrinho() {

    let soma = 0;

    Object.keys(carrinho).forEach(produtoId => {

        const produto = produtos.find(p => p.id === produtoId);

        if (produto) {

            soma += produto.preco * carrinho[produtoId];

        }

    });

    return soma;

}

function atualizarBarraCarrinho() {

    const totalItens = totalItensCarrinho();

    if (totalItens === 0) {

        barraCarrinho.style.display = "none";
        return;

    }

    barraCarrinho.style.display = "flex";
    carrinhoResumoTexto.textContent = totalItens + " item(ns) — " + formatarMoeda(subtotalCarrinho());

}

btnVerCarrinho.onclick = () => {

    renderizarModalCarrinho();
    modalCarrinho.style.display = "flex";

};

btnFecharCarrinho.onclick = () => {

    modalCarrinho.style.display = "none";

};

function renderizarModalCarrinho() {

    const ids = Object.keys(carrinho);

    if (ids.length === 0) {

        itensCarrinhoEl.innerHTML = "<p class='carregandoTexto'>Seu carrinho está vazio.</p>";
        subtotalCarrinhoEl.textContent = formatarMoeda(0);
        return;

    }

    itensCarrinhoEl.innerHTML = ids.map(produtoId => {

        const produto = produtos.find(p => p.id === produtoId);

        if (!produto) return "";

        const qtd = carrinho[produtoId];

        return "<div class='itemCarrinhoLinha'>" +
            "<div>" +
                "<div class='itemCarrinhoNome'>" + produto.nome + "</div>" +
                "<div class='itemCarrinhoPreco'>" + qtd + " x " + formatarMoeda(produto.preco) + "</div>" +
            "</div>" +
            "<div class='produtoAcoes'>" +
                "<button class='btnQtd' data-acao='menos' data-id='" + produtoId + "'>−</button>" +
                "<span class='qtdTexto'>" + qtd + "</span>" +
                "<button class='btnQtd' data-acao='mais' data-id='" + produtoId + "'>+</button>" +
            "</div>" +
        "</div>";

    }).join("");

    itensCarrinhoEl.querySelectorAll("[data-acao]").forEach(btn => {

        btn.onclick = () => {

            const delta = btn.dataset.acao === "mais" ? 1 : -1;
            alterarQuantidadeCarrinho(btn.dataset.id, delta);
            renderizarModalCarrinho();

        };

    });

    subtotalCarrinhoEl.textContent = formatarMoeda(subtotalCarrinho());

}

// ==========================
// CHECKOUT
// ==========================

btnIrParaEntrega.onclick = async () => {

    if (totalItensCarrinho() === 0) {

        alert("Seu carrinho está vazio.");
        return;

    }

    modalCarrinho.style.display = "none";

    await carregarBairrosNoSelect();
    await carregarConfigPagamento();

    document.querySelectorAll("input[name='tipoPedido']").forEach(r => r.checked = (r.value === "entrega"));
    blocoEndereco.style.display = "block";

    checkoutRua.value = "";
    checkoutComplemento.value = "";
    checkoutReferencia.value = "";

    document.querySelectorAll("input[name='formaPagamento']").forEach(r => r.checked = false);
    blocoPix.style.display = "none";
    blocoDinheiro.style.display = "none";
    precisaTroco.checked = false;
    trocoPara.value = "";
    trocoPara.style.display = "none";

    atualizarResumoPedido();

    modalCheckout.style.display = "flex";

};

btnFecharCheckout.onclick = () => {

    modalCheckout.style.display = "none";
    modalCarrinho.style.display = "flex";
    renderizarModalCarrinho();

};

async function carregarBairrosNoSelect() {

    try {

        const resultado = await getDocs(collection(db, "bairros"));

        bairros = [];

        resultado.forEach(docSnap => {

            bairros.push({ id: docSnap.id, ...docSnap.data() });

        });

        checkoutBairro.innerHTML = "<option value=''>Selecione seu bairro</option>" +
            bairros.map(b => "<option value='" + b.id + "'>" + b.nome + " (+" + formatarMoeda(b.taxa) + ")</option>").join("");

    } catch (erro) {

        console.error(erro);

    }

}

async function carregarConfigPagamento() {

    try {

        const dados = await getDoc(doc(db, "configuracoes", "pedidos"));
        configPagamento = dados.exists() ? dados.data() : {};

        chavePixTexto.textContent = configPagamento.chavePix
            ? configPagamento.chavePix + (configPagamento.nomeTitularPix ? " (" + configPagamento.nomeTitularPix + ")" : "")
            : "Chave Pix ainda não configurada pela loja.";

    } catch (erro) {

        console.error(erro);
        configPagamento = {};

    }

}

checkoutBairro.addEventListener("change", atualizarResumoPedido);

document.querySelectorAll("input[name='formaPagamento']").forEach(radio => {

    radio.addEventListener("change", () => {

        blocoPix.style.display = radio.value === "pix" && radio.checked ? "block" : blocoPix.style.display;
        blocoDinheiro.style.display = radio.value === "dinheiro" && radio.checked ? "block" : blocoDinheiro.style.display;

        if (radio.checked && radio.value !== "pix") blocoPix.style.display = "none";
        if (radio.checked && radio.value !== "dinheiro") blocoDinheiro.style.display = "none";

        atualizarResumoPedido();

    });

});

precisaTroco.addEventListener("change", () => {

    trocoPara.style.display = precisaTroco.checked ? "block" : "none";

    if (!precisaTroco.checked) trocoPara.value = "";

});

document.querySelectorAll("input[name='tipoPedido']").forEach(radio => {

    radio.addEventListener("change", () => {

        blocoEndereco.style.display = radio.value === "entrega" ? "block" : "none";
        atualizarResumoPedido();

    });

});

function taxaEntregaAtual() {

    const tipoEl = document.querySelector("input[name='tipoPedido']:checked");

    if (!tipoEl || tipoEl.value !== "entrega") return 0;

    const bairroId = checkoutBairro.value;
    const bairro = bairros.find(b => b.id === bairroId);

    return bairro ? Number(bairro.taxa) : 0;

}

function atualizarResumoPedido() {

    const subtotal = subtotalCarrinho();
    const taxa = taxaEntregaAtual();
    const total = subtotal + taxa;

    resumoPedidoFinal.innerHTML =
        "<div class='linhaResumoItem'><span>Subtotal</span><span>" + formatarMoeda(subtotal) + "</span></div>" +
        "<div class='linhaResumoItem'><span>Taxa de entrega</span><span>" + formatarMoeda(taxa) + "</span></div>" +
        "<div class='linhaResumoTotal'><span>Total</span><span>" + formatarMoeda(total) + "</span></div>";

}

btnFinalizarPedido.onclick = async () => {

    const nome = checkoutNome.value.trim();
    const telefone = checkoutTelefone.value.trim();
    const tipoEl = document.querySelector("input[name='tipoPedido']:checked");
    const tipoPedido = tipoEl ? tipoEl.value : "entrega";
    const bairroId = checkoutBairro.value;
    const rua = checkoutRua.value.trim();
    const formaPagamentoEl = document.querySelector("input[name='formaPagamento']:checked");

    if (!nome || !telefone) {

        alert("Preencha seu nome e WhatsApp.");
        return;

    }

    if (tipoPedido === "entrega" && !bairroId) {

        alert("Selecione o bairro de entrega.");
        return;

    }

    if (tipoPedido === "entrega" && !rua) {

        alert("Preencha o endereço (rua e número).");
        return;

    }

    if (!formaPagamentoEl) {

        alert("Selecione a forma de pagamento.");
        return;

    }

    const bairro = tipoPedido === "entrega" ? bairros.find(b => b.id === bairroId) : null;

    const itens = Object.keys(carrinho).map(produtoId => {

        const produto = produtos.find(p => p.id === produtoId);

        return {

            produtoId: produtoId,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: carrinho[produtoId]

        };

    });

    const subtotal = subtotalCarrinho();
    const taxa = taxaEntregaAtual();
    const total = subtotal + taxa;

    const pedido = {

        itens: itens,
        subtotal: subtotal,
        taxaEntrega: taxa,
        total: total,
        tipoPedido: tipoPedido,
        formaPagamento: formaPagamentoEl.value,
        trocoPara: (formaPagamentoEl.value === "dinheiro" && precisaTroco.checked) ? Number(trocoPara.value) || null : null,
        nomeCliente: nome,
        telefoneCliente: telefone,
        bairro: bairro ? bairro.nome : null,
        rua: tipoPedido === "entrega" ? rua : null,
        complemento: tipoPedido === "entrega" ? checkoutComplemento.value.trim() : "",
        referencia: tipoPedido === "entrega" ? checkoutReferencia.value.trim() : "",
        status: "novo",
        dataCriacao: new Date().toISOString()

    };

    try {

        await addDoc(collection(db, "pedidos"), pedido);

        await descontarEstoque(itens);

        const mensagem = montarMensagemWhatsapp(pedido);
        const numeroLoja = (configPagamento.whatsappLoja || "").replace(/\D/g, "");
        const linkWpp = "https://wa.me/" + numeroLoja + "?text=" + encodeURIComponent(mensagem);

        linkWhatsappPedido.href = linkWpp;

        carrinho = {};

        modalCheckout.style.display = "none";
        modalConfirmacao.style.display = "flex";

        window.open(linkWpp, "_blank");

        await carregarProdutos();

    } catch (erro) {

        console.error(erro);
        alert("❌ Erro ao registrar pedido: " + erro.message);

    }

};

async function descontarEstoque(itens) {

    for (const item of itens) {

        const produto = produtos.find(p => p.id === item.produtoId);

        if (produto && produto.estoqueControlado) {

            const novoEstoque = Math.max(0, Number(produto.estoqueQtd || 0) - item.quantidade);

            try {

                await updateDoc(doc(db, "produtos", item.produtoId), { estoqueQtd: novoEstoque });

            } catch (erro) {

                console.error(erro);

            }

        }

    }

}

function montarMensagemWhatsapp(pedido) {

    const tiposTexto = { entrega: "Entrega", retirada: "Retirada na loja", local: "Consumo no local" };

    let msg = "🍰 *Novo pedido - Sr. Du Doces*\n";
    msg += "(" + (tiposTexto[pedido.tipoPedido] || "Entrega") + ")\n\n";

    pedido.itens.forEach(item => {

        msg += item.quantidade + "x " + item.nome + " — " + formatarMoeda(item.preco * item.quantidade) + "\n";

    });

    msg += "\nSubtotal: " + formatarMoeda(pedido.subtotal);

    if (pedido.tipoPedido === "entrega") {

        msg += "\nTaxa de entrega: " + formatarMoeda(pedido.taxaEntrega);

    }

    msg += "\n*Total: " + formatarMoeda(pedido.total) + "*";

    if (pedido.tipoPedido === "entrega") {

        msg += "\n\n📍 Endereço: " + pedido.rua;
        if (pedido.complemento) msg += ", " + pedido.complemento;
        msg += " — " + pedido.bairro;
        if (pedido.referencia) msg += "\nReferência: " + pedido.referencia;

    }

    const formasTexto = { cartao: "Cartão na entrega", pix: "Pix", dinheiro: "Dinheiro" };
    msg += "\n\n💳 Pagamento: " + formasTexto[pedido.formaPagamento];

    if (pedido.formaPagamento === "dinheiro" && pedido.trocoPara) {

        msg += " (troco para " + formatarMoeda(pedido.trocoPara) + ")";

    }

    msg += "\n\n👤 " + pedido.nomeCliente + " — " + pedido.telefoneCliente;

    return msg;

}

btnNovoPedido.onclick = () => {

    modalConfirmacao.style.display = "none";

};

// ==========================
// ADMIN — LOGIN
// ==========================

btnAbrirAdminCardapio.onclick = () => {

    adminSenhaCardapio.value = "";
    telaAdminLoginCardapio.style.display = "block";

};

btnVoltarAdminLoginCardapio.onclick = () => {

    telaAdminLoginCardapio.style.display = "none";

};

btnEntrarAdminCardapio.onclick = () => {

    if (adminSenhaCardapio.value.trim() !== SENHA_ADMIN) {

        alert("Senha incorreta.");
        return;

    }

    telaAdminLoginCardapio.style.display = "none";
    centralAdminCardapio.style.display = "block";

};

btnSairAdminCardapio.onclick = () => {

    centralAdminCardapio.style.display = "none";

};

// ==========================
// ADMIN — PRODUTOS
// ==========================

btnAdminProdutos.onclick = async () => {

    modalAdminProdutos.style.display = "flex";
    await renderizarListaAdminProdutos();

};

btnFecharAdminProdutos.onclick = () => {

    modalAdminProdutos.style.display = "none";

};

btnSalvarProduto.onclick = async () => {

    const nome = document.getElementById("produtoNome").value.trim();
    const descricao = document.getElementById("produtoDescricao").value.trim();
    const preco = parseFloat(document.getElementById("produtoPreco").value);
    const categoria = document.getElementById("produtoCategoria").value.trim() || "Outros";
    const imagemUrl = document.getElementById("produtoImagemUrl").value.trim();
    const disponivel = document.getElementById("produtoDisponivel").checked;
    const estoqueControlado = produtoControlarEstoque.checked;
    const estoqueQtd = estoqueControlado ? (parseInt(produtoEstoqueQtd.value, 10) || 0) : null;

    if (!nome || isNaN(preco)) {

        alert("Preencha ao menos o nome e o preço.");
        return;

    }

    try {

        await addDoc(collection(db, "produtos"), {

            nome, descricao, preco, categoria, imagemUrl, disponivel, estoqueControlado, estoqueQtd

        });

        document.getElementById("produtoNome").value = "";
        document.getElementById("produtoDescricao").value = "";
        document.getElementById("produtoPreco").value = "";
        document.getElementById("produtoCategoria").value = "";
        document.getElementById("produtoImagemUrl").value = "";
        document.getElementById("produtoDisponivel").checked = true;
        produtoControlarEstoque.checked = false;
        produtoEstoqueQtd.value = "";
        produtoEstoqueQtd.style.display = "none";

        await renderizarListaAdminProdutos();
        await carregarProdutos();

        alert("✅ Produto adicionado!");

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

async function renderizarListaAdminProdutos() {

    listaAdminProdutosEl.innerHTML = "<p>Carregando...</p>";

    try {

        const resultado = await getDocs(collection(db, "produtos"));
        const lista = [];

        resultado.forEach(docSnap => {

            lista.push({ id: docSnap.id, ...docSnap.data() });

        });

        if (lista.length === 0) {

            listaAdminProdutosEl.innerHTML = "<p>Nenhum produto cadastrado ainda.</p>";
            return;

        }

        listaAdminProdutosEl.innerHTML = lista.map(p => {

            const estoqueTexto = p.estoqueControlado
                ? " · estoque: " + (p.estoqueQtd || 0) + (Number(p.estoqueQtd || 0) <= 0 ? " (esgotado)" : "")
                : "";

            return "<div class='pedidoItemAdmin'>" +
                "<strong>" + p.nome + "</strong> — " + formatarMoeda(p.preco) +
                "<p>" + (p.categoria || "Outros") + (p.disponivel === false ? " · indisponível" : "") + estoqueTexto + "</p>" +
                "<button class='botaoPequeno' data-acao='toggle' data-id='" + p.id + "' data-valor='" + (p.disponivel === false) + "'>" +
                    (p.disponivel === false ? "Tornar disponível" : "Tornar indisponível") +
                "</button>" +
                "<button class='botaoPequenoExcluir' data-acao='excluir' data-id='" + p.id + "'>Excluir</button>" +
            "</div>";

        }).join("");

        listaAdminProdutosEl.querySelectorAll("[data-acao='toggle']").forEach(btn => {

            btn.onclick = async () => {

                await updateDoc(doc(db, "produtos", btn.dataset.id), { disponivel: btn.dataset.valor === "true" });
                await renderizarListaAdminProdutos();
                await carregarProdutos();

            };

        });

        listaAdminProdutosEl.querySelectorAll("[data-acao='excluir']").forEach(btn => {

            btn.onclick = async () => {

                if (!confirm("Excluir este produto?")) return;

                await deleteDoc(doc(db, "produtos", btn.dataset.id));
                await renderizarListaAdminProdutos();
                await carregarProdutos();

            };

        });

    } catch (erro) {

        console.error(erro);
        listaAdminProdutosEl.innerHTML = "<p>Erro ao carregar produtos.</p>";

    }

}

// ==========================
// ADMIN — BAIRROS
// ==========================

btnAdminBairros.onclick = async () => {

    modalAdminBairros.style.display = "flex";
    await renderizarListaAdminBairros();

};

btnFecharAdminBairros.onclick = () => {

    modalAdminBairros.style.display = "none";

};

btnSalvarBairro.onclick = async () => {

    const nome = document.getElementById("bairroNome").value.trim();
    const taxa = parseFloat(document.getElementById("bairroTaxa").value);

    if (!nome || isNaN(taxa)) {

        alert("Preencha o nome do bairro e a taxa.");
        return;

    }

    try {

        await addDoc(collection(db, "bairros"), { nome, taxa });

        document.getElementById("bairroNome").value = "";
        document.getElementById("bairroTaxa").value = "";

        await renderizarListaAdminBairros();

        alert("✅ Bairro adicionado!");

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

async function renderizarListaAdminBairros() {

    listaAdminBairrosEl.innerHTML = "<p>Carregando...</p>";

    try {

        const resultado = await getDocs(collection(db, "bairros"));
        const lista = [];

        resultado.forEach(docSnap => {

            lista.push({ id: docSnap.id, ...docSnap.data() });

        });

        if (lista.length === 0) {

            listaAdminBairrosEl.innerHTML = "<p>Nenhum bairro cadastrado ainda.</p>";
            return;

        }

        listaAdminBairrosEl.innerHTML = lista.map(b =>

            "<div class='pedidoItemAdmin'>" +
                "<strong>" + b.nome + "</strong> — " + formatarMoeda(b.taxa) +
                "<br><button class='botaoPequenoExcluir' data-id='" + b.id + "'>Excluir</button>" +
            "</div>"

        ).join("");

        listaAdminBairrosEl.querySelectorAll("[data-id]").forEach(btn => {

            btn.onclick = async () => {

                if (!confirm("Excluir este bairro?")) return;

                await deleteDoc(doc(db, "bairros", btn.dataset.id));
                await renderizarListaAdminBairros();

            };

        });

    } catch (erro) {

        console.error(erro);
        listaAdminBairrosEl.innerHTML = "<p>Erro ao carregar bairros.</p>";

    }

}

// ==========================
// ADMIN — PEDIDOS
// ==========================

btnAdminPedidos.onclick = async () => {

    modalAdminPedidos.style.display = "flex";
    await renderizarListaAdminPedidos();

};

btnFecharAdminPedidos.onclick = () => {

    modalAdminPedidos.style.display = "none";

};

async function renderizarListaAdminPedidos() {

    listaAdminPedidosEl.innerHTML = "<p>Carregando...</p>";

    try {

        const resultado = await getDocs(collection(db, "pedidos"));
        const lista = [];

        resultado.forEach(docSnap => {

            lista.push({ id: docSnap.id, ...docSnap.data() });

        });

        lista.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

        if (lista.length === 0) {

            listaAdminPedidosEl.innerHTML = "<p>Nenhum pedido ainda.</p>";
            return;

        }

        const formasTexto = { cartao: "Cartão na entrega", pix: "Pix", dinheiro: "Dinheiro" };
        const statusTexto = { novo: "Recebido", preparando: "Em preparo", saiu_para_entrega: "A caminho", concluido: "Concluído" };
        const tiposTexto = { entrega: "Entrega", retirada: "Retirada na loja", local: "Consumo no local" };

        listaAdminPedidosEl.innerHTML = lista.map(pedido => {

            const itensTexto = pedido.itens.map(i => i.quantidade + "x " + i.nome).join(", ");
            const status = pedido.status || "novo";
            const enderecoTexto = pedido.tipoPedido === "entrega" ? "<p>📍 " + pedido.rua + " — " + pedido.bairro + "</p>" : "";

            return "<div class='pedidoItemAdmin'>" +
                "<strong>" + pedido.nomeCliente + "</strong> — " + pedido.telefoneCliente +
                "<p>" + (tiposTexto[pedido.tipoPedido] || "Entrega") + "</p>" +
                "<p>" + itensTexto + "</p>" +
                enderecoTexto +
                "<p>💳 " + (formasTexto[pedido.formaPagamento] || pedido.formaPagamento) + " · Total: " + formatarMoeda(pedido.total) + "</p>" +
                "<p>Status: " + (statusTexto[status] || status) + "</p>" +
                renderizarBotoesStatus(pedido, status) +
            "</div>";

        }).join("");

        listaAdminPedidosEl.querySelectorAll("[data-avancar]").forEach(btn => {

            btn.onclick = async () => {

                const pedido = lista.find(p => p.id === btn.dataset.id);
                const novoStatus = btn.dataset.avancar;

                await updateDoc(doc(db, "pedidos", btn.dataset.id), { status: novoStatus });

                const mensagem = montarMensagemStatus(pedido, novoStatus);
                const numeroCliente = (pedido.telefoneCliente || "").replace(/\D/g, "");
                const linkWpp = "https://wa.me/" + numeroCliente + "?text=" + encodeURIComponent(mensagem);

                window.open(linkWpp, "_blank");

                await renderizarListaAdminPedidos();

            };

        });

    } catch (erro) {

        console.error(erro);
        listaAdminPedidosEl.innerHTML = "<p>Erro ao carregar pedidos.</p>";

    }

}

function renderizarBotoesStatus(pedido, status) {

    if (status === "novo") {

        return "<button class='botaoPequeno' data-avancar='preparando' data-id='" + pedido.id + "'>🍳 Marcar em preparo</button>";

    }

    if (status === "preparando") {

        const proximoTexto = pedido.tipoPedido === "entrega" ? "🚚 Saiu para entrega" : "✅ Pronto pra retirada";
        const proximoStatus = pedido.tipoPedido === "entrega" ? "saiu_para_entrega" : "concluido";

        return "<button class='botaoPequeno' data-avancar='" + proximoStatus + "' data-id='" + pedido.id + "'>" + proximoTexto + "</button>";

    }

    if (status === "saiu_para_entrega") {

        return "<button class='botaoPequeno' data-avancar='concluido' data-id='" + pedido.id + "'>✅ Concluir pedido</button>";

    }

    return "<span class='textoAuxiliar'>Pedido concluído ✅</span>";

}

function montarMensagemStatus(pedido, novoStatus) {

    const nome = pedido.nomeCliente || "";

    if (novoStatus === "preparando") {

        return "Oi " + nome + "! Seu pedido na Sr. Du Doces foi aceito e já está em preparo. 🍰";

    }

    if (novoStatus === "saiu_para_entrega") {

        return "Oi " + nome + "! Seu pedido saiu para entrega e já está a caminho. 🛵";

    }

    if (novoStatus === "concluido") {

        let msg = "Oi " + nome + "! Seu pedido foi concluído. Esperamos que goste! 🎉";

        if (configPagamento.linkGoogle) {

            msg += "\n\nSe puder, deixe uma avaliação pra gente: " + configPagamento.linkGoogle;

        }

        return msg;

    }

    return "Atualização do seu pedido na Sr. Du Doces.";

}

// ==========================
// ADMIN — CONFIG PAGAMENTO
// ==========================

btnAdminConfigPagamento.onclick = async () => {

    modalConfigPagamento.style.display = "flex";

    await carregarConfigPagamento();

    configChavePix.value = configPagamento.chavePix || "";
    configNomeTitularPix.value = configPagamento.nomeTitularPix || "";
    configWhatsappLoja.value = configPagamento.whatsappLoja || "";
    configEnderecoLoja.value = configPagamento.enderecoLoja || "";
    configLinkGoogle.value = configPagamento.linkGoogle || "";

};

btnFecharConfigPagamento.onclick = () => {

    modalConfigPagamento.style.display = "none";

};

btnSalvarConfigPagamento.onclick = async () => {

    try {

        const novaConfig = {

            chavePix: configChavePix.value.trim(),
            nomeTitularPix: configNomeTitularPix.value.trim(),
            whatsappLoja: configWhatsappLoja.value.trim(),
            enderecoLoja: configEnderecoLoja.value.trim(),
            linkGoogle: configLinkGoogle.value.trim()

        };

        await setDoc(doc(db, "configuracoes", "pedidos"), novaConfig);

        configPagamento = novaConfig;

        alert("✅ Configurações salvas!");

        modalConfigPagamento.style.display = "none";

        await atualizarCabecalhoLoja();

    } catch (erro) {

        console.error(erro);
        alert("❌ " + erro.message);

    }

};

async function atualizarCabecalhoLoja() {

    try {

        await carregarConfigPagamento();

        if (configPagamento.enderecoLoja) {

            textoEnderecoLoja.textContent = configPagamento.enderecoLoja;
            linkEnderecoLoja.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(configPagamento.enderecoLoja);
            linkEnderecoLoja.style.display = "inline-block";

        } else {

            linkEnderecoLoja.style.display = "none";

        }

    } catch (erro) {

        console.error(erro);

    }

}

// ==========================
// ACOMPANHAR PEDIDO (CLIENTE)
// ==========================

let intervaloAcompanhamento = null;

btnAcompanharPedido.onclick = () => {

    acompanharTelefone.value = "";
    statusPedidoBox.style.display = "none";
    modalAcompanharPedido.style.display = "flex";

};

btnFecharAcompanharPedido.onclick = () => {

    modalAcompanharPedido.style.display = "none";

    if (intervaloAcompanhamento) {

        clearInterval(intervaloAcompanhamento);
        intervaloAcompanhamento = null;

    }

};

btnBuscarPedido.onclick = async () => {

    await buscarUltimoPedido();

    if (intervaloAcompanhamento) clearInterval(intervaloAcompanhamento);

    intervaloAcompanhamento = setInterval(buscarUltimoPedido, 15000);

};

async function buscarUltimoPedido() {

    const telefone = acompanharTelefone.value.trim();

    if (!telefone) {

        alert("Digite seu WhatsApp.");
        return;

    }

    try {

        const consulta = query(collection(db, "pedidos"), where("telefoneCliente", "==", telefone));
        const resultado = await getDocs(consulta);

        if (resultado.empty) {

            statusPedidoBox.style.display = "none";
            alert("Nenhum pedido encontrado com esse WhatsApp.");
            return;

        }

        const pedidos = [];

        resultado.forEach(docSnap => pedidos.push({ id: docSnap.id, ...docSnap.data() }));

        pedidos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

        renderizarStatusPedido(pedidos[0]);

    } catch (erro) {

        console.error(erro);

    }

}

function renderizarStatusPedido(pedido) {

    const status = pedido.status || "novo";
    const ordem = ["novo", "preparando", "saiu_para_entrega", "concluido"];
    const indiceAtual = ordem.indexOf(status);

    document.querySelectorAll(".etapaStatus").forEach(etapa => {

        const indiceEtapa = ordem.indexOf(etapa.dataset.etapa);
        etapa.classList.toggle("ativa", indiceEtapa <= indiceAtual);

    });

    const textos = {

        novo: "Seu pedido foi recebido pela loja.",
        preparando: "Seu pedido está sendo preparado com carinho! 🍰",
        saiu_para_entrega: "Seu pedido saiu para entrega e já está a caminho! 🛵",
        concluido: "Pedido concluído. Esperamos que tenha gostado! 🎉"

    };

    statusPedidoTexto.textContent = textos[status] || "";

    if (status === "concluido" && configPagamento.linkGoogle) {

        linkAvaliarAposPedido.href = configPagamento.linkGoogle;
        linkAvaliarAposPedido.style.display = "block";

        if (intervaloAcompanhamento) {

            clearInterval(intervaloAcompanhamento);
            intervaloAcompanhamento = null;

        }

    } else {

        linkAvaliarAposPedido.style.display = "none";

    }

    statusPedidoBox.style.display = "block";

}

// ==========================
// INÍCIO
// ==========================

carregarProdutos();
atualizarCabecalhoLoja();

console.log("✅ Cardápio Sr. Du Doces carregado.");
