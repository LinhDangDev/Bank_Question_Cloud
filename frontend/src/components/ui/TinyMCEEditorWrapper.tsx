import { forwardRef } from 'react';

const TinyMCEEditorWrapper = forwardRef((props: any, ref) => {
  const { Editor } = require('@tinymce/tinymce-react');
  return <Editor {...props} editorRef={ref} />;
});

export default TinyMCEEditorWrapper;
