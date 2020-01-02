import * as store from './store'

export default function(routes, cb) {
  // create events for pushState and replaceState
  ;['pushState', 'replaceState'].forEach(eventName => {
    const fn = history[eventName]
    history[eventName] = function(state, title, url) {
      const event = Object.assign(
        new Event(eventName.toLowerCase(), { state, title, url })
      )
      Object.assign(event, { state, title, url })

      fn.apply(this, [state, title, url])
      return dispatchEvent(event)
    }
  })

  function updatePage(url, shallow) {
    const currentUrl = window.location.pathname
    url = url || currentUrl

    const route = urlToRoute(url, routes)
    const currentRoute = shallow && urlToRoute(currentUrl, routes)
    const contextRoute = currentRoute || route
    const layouts = [...contextRoute.layouts, route]

    //set the route in the store
    store.route.set(route)

    //run callback in Router.svelte
    cb({ layouts, route })
  }

  function click(event) {
    const el = event.target.closest('a')
    const href = el && el.getAttribute('href')

    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      event.button ||
      event.defaultPrevented
    )
      return
    if (!href || el.target || el.host !== location.host) return

    event.preventDefault()
    history.pushState({}, '', href)
  }

  return { updatePage, click }
}

function urlToRoute(url, routes) {
  const route = routes.find(route => url.match(route.regex))
  if (!route)
    throw new Error(
      `Route could not be found. Make sure ${url}.svelte or ${url}/index.svelte exists. A restart may be required.`
    )

  const params = {}
  if (route.paramKeys) {
    url.match(route.regex).forEach((match, i) => {
      if (i === 0) return
      const key = route.paramKeys[i - 1]
      params[key] = match
    })
  }
  route.params = params

  route.leftover = url.replace(new RegExp(route.regex), '')

  return route
}
