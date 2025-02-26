import {Runtime, Inspector} from 'https://cdn.jsdelivr.net/npm/@observablehq/runtime@5.8.2/+esm'

const rt = new Runtime()
window.mod = rt.module(function define(runtime, observer) {
  const main = runtime.module()
  main.variable(observer('lineup')).define(
    ['lineup', 'page', 'html'],
    function (lineup, page, html) {
      return html`${lineup.map(page)}`
    })
  main.variable(observer('lineup')).define('lineup', () => [])
  main.variable(observer('page')).define(
    'page', ['html', 'md', 'svg'],
    (html, md, svg) => {
      function toDOM(item) {
        const linked = text => text
              .replace(/\[\[(.*?)\]\]/g, (_,title) => `<a class="internal" data-title="${title}" href="#">${title}</a>`)
              .replace(/\[(https?:.*?) (.*?)\]/g, (_,url,word) => `<a href="${url.replace(/^https?:/,'')}">${word}</a>`)
        const {type='unknown', text=''} = item
        let el
        switch(type) {
        case 'paragraph':
          el = html`<p>${linked(text)}`
          break
        case 'html':
          el = html`${linked(text)}`
          break
        case 'markdown':
          el = md`${linked(text)}`
          break
        default:
          el = html`<p>Oops. <code>${type}</code></p><pre>${text}</pre>`
          break
        }
        el.querySelectorAll('a').forEach(a => {
          if (a.classList.contains('internal')) {
            a.onclick = event => {
              let {title} = event.target.dataset.title
            }
          } else {
            a.setAttribute('target', '_blank')
          }
        })
        return el
      }
      return (function page({
        flag='./icon-120.png', page:{title='Untitled', story=[]}={}
      }) {
        return html`<article>
          <div class=twins></div>
          <header><h1><img src="${flag}"> ${title}</h1></header>
          ${story.map(toDOM)}
          <footer></footer>
        </article>`
      }
    )})
}, name => {
  if (name == 'lineup') {
    return new Inspector(document.querySelector('main'))
  }
})

const channel = new BroadcastChannel('wiki')
channel.onmessage = async function message(event) {
  if (typeof event.data == "object") {
    const {action='unknown', data={}} = event.data
    switch(action) {
    case 'update':
      window.mod.redefine('lineup', () => event.data.lineup)
      break
    }
  }
}
window.wiki = {
  findPage({title, context=[]}) {
    for(let siteMap of context) {
      for(let page of Object.values(siteMap)) {
        if (page.title.toLowerCase() == title.toLowerCase()) {
          return page
        }
      }
    }
    return {}
  },
  update(lineup) {
    window.mod.redefine('lineup', () => lineup)
    channel.postMessage({action:'update', lineup})
  }
}

window.addEventListener("load", () => {
  window.wiki.update(
    [
      'Zip',
      'Zippity Doo Dah. Zippity Eh. My, oh my.',
      'Hello, World!',
      'Welcome Visitors'
    ].map(title => ({
      flag:'./icon-120.png',
      page:{title, story:[
        {
          type:"paragraph",
          text:"This is a paragraph. With an unexpanded [[Internal Link]]"
        },
        {
          type:"markdown",
          text:"This paragraph _has markdown_. [Markdown Link](//wiki.dbbs.co/apparatus.html)\n\n[https://wander.dbbs.co/commonplace-book.html External Link]"
        },
        ...(Array.from({length:Math.round(Math.random()*4) + 2}, _ => ({
          type: "paragraph",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        })))
      ]}
    }))
  )
})
