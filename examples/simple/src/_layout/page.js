export function data(settings) {
    settings.layoutPath = "base.js";
}

export function render(data, template) {
    return `
<main>
    <nav>
        <a href="about/">About</a>
        <a href="contact/">Contact</a>
    <nav>
    ${template}
</main>
`
}
