import buildBabelOptions from '@dbux/cli/dist/util/buildBabelOptions';
import { transformSync } from '@babel/core';

export default function instrument(inputCode) {
  const options = {
    vanilla: false,
    dontInjectDbux: false,
    dontAddPresets: true
  };
  const babelOptions = buildBabelOptions(options);
  const outputCode = transformSync(inputCode, babelOptions).code;

  // const prettyCode = prettier.format(outputCode,
  //   // see https://stackoverflow.com/questions/50561649/module-build-failed-error-no-parser-and-no-file-path-given-couldnt-infer-a-p
  //   { parser: "babel" }
  // );

  return outputCode;
}