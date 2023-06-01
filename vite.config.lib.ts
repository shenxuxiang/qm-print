import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import presetEnv from 'postcss-preset-env';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    define: Object.keys(env).reduce((memo: object, key: string) => {
      memo[key] = JSON.stringify(env[key]);
      return memo;
    }, {}),
    publicDir: resolve('public'),
    clearScreen: true,
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [],
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnable: true,
          globalVars: {},
          modifyVars: {},
          additionalData: '',
        }
      },
      postcss: {
        plugins: [ presetEnv ],
      },
      devSourcemap: true,
    },
    build: {
      sourcemap: 'hidden',
      outDir: resolve('lib'),
      copyPublicDir: false,
      minify: 'terser',
      cssMinify: true,
      cssCodeSplit: true,
      assetsInlineLimit: 10 * 1024,
      emptyOutDir: true,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        }
      },
      lib: {
        entry: resolve('src/print.ts'),
        name: 'Printer',
        fileName: 'qm-print',
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {
            'react': 'react',
            'react-dom': 'react-dom',
          },
        },
      },
    },
  };
})
