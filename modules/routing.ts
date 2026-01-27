import { defineNuxtModule, useNuxt } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'routing-extensions',
  },
  setup() {
    const nuxt = useNuxt()

    /**
     * Supported patterns:
     *   /nuxt → packageName: "nuxt", requestedVersion: null
     *   /nuxt/v/4.2.0 → packageName: "nuxt", requestedVersion: "4.2.0"
     *   /@nuxt/kit → packageName: "@nuxt/kit", requestedVersion: null
     *   /@nuxt/kit/v/1.0.0 → packageName: "@nuxt/kit", requestedVersion: "1.0.0"
     *   /axios@1.13.3 → packageName: "axios", requestedVersion: "1.13.3"
     *   /@nuxt/kit@1.0.0 → packageName: "@nuxt/kit", requestedVersion: "1.0.0"
     */

    nuxt.hook('pages:resolved', pages => {
      const packagePage = pages.find(page => page.name === 'package')
      if (packagePage) {
        packagePage.path = '/:org(@[^/]+)?/:name'
        packagePage.alias = ['/package/:org(@[^/]+)?/:name']
      }
      pages.push({
        ...packagePage,
        name: 'package-version',
        path: '/:org(@[^/]+)?/:name/v/:version',
        alias: ['/:org(@[^/]+)?/:name@:version', '/package/:org(@[^/]+)?/:name/v/:version'],
      })
    })
  },
})
