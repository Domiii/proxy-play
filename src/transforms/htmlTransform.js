export default function htmlTransform(meta, data) {
  
  // TODO: modify src of all remote script + iframe tags
  // TODO: modify content of all inline JS <script> tags
  data = '<h1>hi ####</h1>' + data;

  return data;
}