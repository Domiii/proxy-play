export default class BufferedPipe extends PipeBase {
  init() {
    const { streamIn, streamOut } = this;
    let data = '';

    streamIn
      .on('data', function (chunk) {
        // TODO: want to buffer things properly and only convert to string when making sure that characters are not chopped up in buffer anymore
        data += chunk.toString();
      })
      .on('end', function () {
        this.onBuffered(data);
      });
  }
}