

* multi-script tag management needs more work because different script tags end up conflicting with one another
   * need to set separate program paths and maintain per-program state for each script tag
   * `fixInlineJs` cannot work correctly with multiple script tags, as the later tags would override state of the previous ones
* several bugs when trying to process the traces in dbux-data