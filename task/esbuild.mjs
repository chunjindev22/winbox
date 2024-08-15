import esbuild from 'esbuild';
import package_json from '../package.json' with { type: "json" };


async function compileCssToJs(esbuild, path) {
  const compiledCss = await esbuild.build({
    bundle: true,
    entryPoints: [path],
    loader: {
      '.svg': 'dataurl',
    },
    minify: true,
    write: false
  });

  if (compiledCss.outputFiles.length !== 1) {
    throw "Expected one css output file";
  }
  const css = JSON.stringify(compiledCss.outputFiles[0].text);

  const script = `
    (() => {
        const style = document.createElement('style');
        style.innerHTML = ${css};
        document.head.append(style);
    })()
  `
  return script;
}

const jsBanner = `
/**
 * WinBox.js Bundle (${package_json.version})
 * Author and Copyright: Thomas Wilkerling
 * @Licence: Apache-2.0
 * Hosted by Nextapps GmbH
 * https://github.com/nextapps-de/winbox
 */
`
esbuild.build({
    bundle: true,
    outfile: "dist/js/winbox.min.js",
    minify: true,
    stdin: {
        contents: `
        import WinBox from './winbox.js';
        module.exports = WinBox;
        `,
        resolveDir: "src/js/"
    },
    loader: {
      '.svg': 'dataurl',
    },
    banner: {
      js: jsBanner
    },
    plugins: [
      {
        name: "Import CSS",
        setup(build) {
          build.onLoad({ filter: /\.css$/}, async (args) => {
            if (args.namespace !== 'file') {
              return;
            }
            return {
                contents: await compileCssToJs(build.esbuild, args.path),
                loader: 'js'
            }
          })
        }
    },
    ],
    globalName: "WinBox",
    metafile: true
  });
