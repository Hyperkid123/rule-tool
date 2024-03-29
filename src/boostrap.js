import { Button } from "@patternfly/react-core"
import React, { Fragment } from "react"
import { render } from "react-dom"

const useDynamicScript = (args) => {
  const scriptElement = React.useRef(null)
  const [ready, setReady] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  const getEntry = async (url) => {
    let manifest = await fetch(url).then((d) => d.json())
    manifest = manifest["advisor"].entry[0]
    const result = manifest

    const element = document.createElement("script")

    element.src = result
    element.type = "text/javascript"
    element.async = true

    setReady(false)
    setFailed(false)

    element.onload = () => {
      console.log(`Dynamic Script Loaded: ${result}`)
      scriptElement.current = element
      setReady(true)
    }

    element.onerror = () => {
      console.error(`Dynamic Script Error: ${result}`)
      setReady(false)
      setFailed(true)
    }

    document.head.appendChild(element)
  }

  React.useEffect(() => {
    if (!args.url) {
      return
    }

    getEntry(args.url)

    return () => {
      if (scriptElement.current) {
        console.log(`Dynamic Script Removed: ${args.url}`)
        document.head.removeChild(scriptElement.current)
      }
    }
  }, [args.url])

  return {
    ready,
    failed,
  }
}

function loadComponent(scope, module) {
  return async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    // eslint-disable-next-line no-undef
    await __webpack_init_sharing__("default")

    const container = window[scope] // or get the container somewhere else
    // Initialize the container, it may provide shared modules
    // eslint-disable-next-line no-undef
    await container.init(__webpack_share_scopes__.default)
    const factory = await window[scope].get(module)
    const Module = factory()
    return Module
  }
}

const url = "/apps/advisor/fed-mods.json"

const AsyncComponent = () => {
  const { ready, failed } = useDynamicScript({
    url,
  })
  if (!ready) {
    return <h2>Loading dynamic script: {url}</h2>
  }

  if (failed) {
    return <h2>Failed to load dynamic script: {url}</h2>
  }

  const Component = React.lazy(loadComponent("advisor", "./AdvisorReportDetails"))

  return (
    <React.Suspense fallback="Loading">
      <Component />
    </React.Suspense>
  )
}

const App = () => {
  return (
    <Fragment>
      <Button>PF button</Button>
      <AsyncComponent />
    </Fragment>
  )
}

render(<App />, document.getElementById("root"))
