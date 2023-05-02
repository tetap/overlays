import { createPromiser, defineName } from '@overlays/core'
import { pascalCase } from 'pascal-case'
import type { FC } from 'react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ImperativeOverlay, MountOptions, Promiser } from '@overlays/core'
import { Context } from '../internal'

export type InjectionHolder<Props, Resolved> = [JSX.Element, ImperativeOverlay<Props, Resolved>]

export function useInjectHolder<Props, Resolved = void>(
  Component: FC,
  options: MountOptions = {},
): InjectionHolder<Props, Resolved> {
  const { callback, scripts, props, refresh } = useRefreshMetadata()

  const name = defineName(options.id, options.autoIncrement)
  const root = options.root || document.body
  const isTeleport = options.root !== false

  function render() {
    const content = <div id={name}> <Component {...props} /> </div>
    return isTeleport ? createPortal(content, root) : content
  }

  const holder = (
    <Context.Provider
      value={scripts}
      children={refresh ? render() : null}
      {...{ id: pascalCase(name) }}
    />
  )

  return [holder, callback as any]
}

export function useRefreshMetadata() {
  const [props, setProps] = useState<any>()
  const [refresh, setRefresh] = useState(false)
  const [visible, setVisible] = useState(false)

  const promiser = useRef<Promiser>({} as any)

  const scripts = {
    promiser: promiser.current,
    resolve: promiser.current.resolve,
    reject: promiser.current.reject,
    vanish,
    visible,
    setVisible,
  }

  function vanish() {
    setRefresh(false)
    setProps({})
    scripts.reject?.()
  }

  async function callback(props: any) {
    promiser.current = createPromiser()

    setProps(props)
    setRefresh(true)

    return promiser.current
  }

  return { callback, scripts, props, refresh }
}