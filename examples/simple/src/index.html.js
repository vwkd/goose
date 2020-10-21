export function data(settings) {
    settings.layoutPath = "page.js"
}

export function render(data, template) {
    return `
<h1>${data.title}</h1>

<p>Lorem ipsum...</p>
`
}