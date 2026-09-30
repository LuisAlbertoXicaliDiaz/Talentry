const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("nav");

menuButton.addEventListener("click", () => {

    nav.classList.toggle("active");

    const icon = menuButton.querySelector("i");

    if (nav.classList.contains("active")) {

        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");

    } else {

        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

    }

});


// ---------- CERRAR MENÚ ----------

const navLinks = document.querySelectorAll(".nav a");

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        nav.classList.remove("active");

        const icon = menuButton.querySelector("i");

        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

    });

});


// =========================================
// MODO OSCURO
// =========================================

const themeButton = document.getElementById("themeButton");
const themeIcon = themeButton.querySelector("i");


// Comprobar si el usuario ya había elegido
const savedTheme = localStorage.getItem("talentry-theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");

}


// Cambiar tema

themeButton.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {

        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");

        localStorage.setItem("talentry-theme", "dark");

    } else {

        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");

        localStorage.setItem("talentry-theme", "light");

    }

});


// ---------- ANIMACIÓN AL HACER SCROLL ----------

const sections = document.querySelectorAll(".section");

const observer = new IntersectionObserver(

    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    },

    {
        threshold: 0.12
    }

);


sections.forEach(section => {

    observer.observe(section);

});

// =========================================
// CARGAR SECCIONES EXTERNAS
// =========================================

async function cargarSeccion(archivo, contenedor) {

    try {

        const respuesta = await fetch(archivo);

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar ${archivo}`);
        }

        const contenido = await respuesta.text();

        document.getElementById(contenedor).innerHTML = contenido;

    } catch (error) {

        console.error(error);

    }
}


// Cargar beneficios
cargarSeccion(
    "secciones/beneficios.html",
    "beneficios-container"
);


// Cargar estadísticas
cargarSeccion(
    "secciones/estadisticas.html",
    "estadisticas-container"
);


// Cargar innovación
cargarSeccion(
    "secciones/innovacion.html",
    "innovacion-container"
);


// Cargar buscador
cargarSeccion(
    "secciones/buscador.html",
    "buscador-container"
);


// Cargar testimonios
cargarSeccion(
    "secciones/testimonios.html",
    "testimonios-container"
);