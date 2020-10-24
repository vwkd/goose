export function config(settings) {
    settings.layoutPath = "page.js"
}

export function render(data, template) {
    return `<h1>${data.title}</h1>

<p>Here you can find the answer...</p>

<p>${data.answer}</p>`
}