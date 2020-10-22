export function data(settings) {
    settings.layoutPath = "page.js"

    return {
        title: "About"
    }
}

export function render(data, template) {
    return `
<h1>${data.title}</h1>

<p>Here you can read about me...</p>
`
}