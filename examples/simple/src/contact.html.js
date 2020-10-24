export function config(settings) {
    settings.layoutPath = "page.js";
}

export const data = {
    title: "Contact"
};

export function render(data, template) {
    return `<h1>${data.title}</h1>

<p>Here you can contact me...</p>`;
}
