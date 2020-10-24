export function config(settings) {
    settings.layoutPath = "page.js";
}

export const data = {
    title: "About"
};

export function render(data, template) {
    return `<h1>${data.title}</h1>

<p>Here you can read about me...</p>`;
}
