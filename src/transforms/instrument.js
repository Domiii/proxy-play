import buildBabelOptions from '@dbux/cli/dist/util/buildBabelOptions';
import { transformSync } from '@babel/core';

export default function instrument(inputCode) {
  // see https://github.com/Domiii/dbux/dbux-cli/src/commandCommons.js
  const options = {
    esnext: true,
    dontInjectDbux: false,
    dontAddPresets: true,
    verbose: false
  };
  const babelOptions = buildBabelOptions(options);
  const outputCode = transformSync(inputCode, babelOptions).code;

  // const prettyCode = prettier.format(outputCode,
  //   // see https://stackoverflow.com/questions/50561649/module-build-failed-error-no-parser-and-no-file-path-given-couldnt-infer-a-p
  //   { parser: "babel" }
  // );

  return outputCode;
}
