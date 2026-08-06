const contenedor = document.getElementById("resultado");
const buscador = document.getElementById("buscador");
const boton = document.getElementById("btn-buscar");
const botonCargarMas = document.getElementById("cargar-mas");
const spinner = document.getElementById("spinner");
const mensaje = document.getElementById("mensaje");

let pokedex = [];
let offset = 0;

function crearTarjeta(pokemon) {
  const { nombre, imagen, tipos } = pokemon;
  const img = imagen ?? "https://via.placeholder.com/96?text=?";
  const badges = tipos
    .map(function (tipo) {
      return `
        <span class="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
          ${tipo}
        </span>
      `;
    })
    .join("");
  const articulo = document.createElement("article");
  articulo.className = "bg-white rounded-xl shadow p-4 text-center";
  articulo.innerHTML = `
    <img
      src="${img}"
      alt="${nombre}"
      class="w-24 h-24 mx-auto"
    >
    <h2 class="capitalize font-bold text-slate-800 mt-2">
      ${nombre}
    </h2>
    <div class="flex gap-1 justify-center mt-2 flex-wrap">
      ${badges}
    </div>
  `;
  return articulo;
}

function render(lista) {
  contenedor.innerHTML = "";
  lista.forEach(function (pokemon) {
    const tarjeta = crearTarjeta(pokemon);
    contenedor.appendChild(tarjeta);
  });
}

function adaptarPokemon(data) {
  return {
    nombre: data.name,
    imagen: data.sprites?.front_default ?? "https://via.placeholder.com/96?text=?",
    tipos: data.types.map(function (t) {
      return t.type.name;
    }),
    stats: data.stats.map(function (s) {
      return { nombre: s.stat.name, valor: s.base_stat };
    })
  };
}

// ---------- HU2: obtenerPokemon detecta 404 y lanza error propio ----------

async function obtenerPokemon(idONombre) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idONombre}`);

  if (!response.ok) {
    throw new Error(`No se encontró "${idONombre}"`);
  }

  return response.json();
}

// ---------- HU3: carga inicial con spinner + try/catch/finally ----------

async function cargarPokedex() {
  spinner.classList.remove("hidden");
  mensaje.classList.add("hidden");

  try {
    const nombres = ["bulbasaur", "charmander", "squirtle", "pikachu", "jigglypuff", "gengar"];
    const datos = await Promise.all(nombres.map(obtenerPokemon));
    pokedex = datos.map(adaptarPokemon);
    render(pokedex);
  } catch (error) {
    mensaje.textContent = "No se pudo cargar la Pokédex.";
    mensaje.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

cargarPokedex();

// ---------- Búsqueda ----------

async function buscarPokemon(nombre) {
  const data = await obtenerPokemon(nombre.toLowerCase());
  return adaptarPokemon(data);
}

// ---------- HU1 + HU2 + HU3: try/catch/finally + spinner + mensaje ----------

async function mostrarBusqueda(nombre) {
  spinner.classList.remove("hidden");
  mensaje.classList.add("hidden");

  try {
    const pokemon = await buscarPokemon(nombre);
    mostrarResultado(pokemon);
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

boton.addEventListener("click", function () {
  const nombre = buscador.value.trim();
  if (nombre !== "") mostrarBusqueda(nombre);
});

buscador.addEventListener("keydown", function (event) {
  if (event.key === "Enter") boton.click();
});

// ---------- Capturar y mostrar resultado (con estadísticas) ----------

function capturar(pokemon) {
  if (!pokedex.some(function (p) { return p.nombre === pokemon.nombre; })) {
    pokedex.push(pokemon);
  }
  render(pokedex);
  buscador.value = "";
}

function mostrarResultado(pokemon) {
  const tarjeta = crearTarjeta(pokemon);

  const stats = document.createElement("div");
  stats.className = "mt-2 text-left text-xs space-y-1";
  stats.innerHTML = pokemon.stats.map(function (s) {
    return `
      <div class="flex justify-between">
        <span class="capitalize">${s.nombre}</span>
        <span class="font-semibold">${s.valor}</span>
      </div>
    `;
  }).join("");
  tarjeta.appendChild(stats);

  const botonCapturar = document.createElement("button");
  botonCapturar.textContent = "⚡ Capturar";
  botonCapturar.className = "mt-2 w-full bg-yellow-400 font-semibold rounded-lg py-1 hover:bg-yellow-500";
  botonCapturar.addEventListener("click", function () {
    capturar(pokemon);
  });
  tarjeta.appendChild(botonCapturar);

  contenedor.innerHTML = "";
  contenedor.appendChild(tarjeta);
}

// ---------- Cargar más ----------

async function cargarMas() {
  spinner.classList.remove("hidden");
  mensaje.classList.add("hidden");

  try {
    const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=12&offset=${offset}`);

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar más Pokémon.");
    }

    const lista = await respuesta.json();

    const datos = await Promise.all(
      lista.results.map(function (item) {
        return fetch(item.url).then(function (r) { return r.json(); });
      })
    );

    datos.map(adaptarPokemon).forEach(function (pokemon) {
      if (!pokedex.some(function (p) { return p.nombre === pokemon.nombre; })) {
        pokedex.push(pokemon);
      }
    });

    offset += 12;
    render(pokedex);
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.remove("hidden");
  } finally {
    spinner.classList.add("hidden");
  }
}

botonCargarMas.addEventListener("click", cargarMas);