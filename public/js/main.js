$(function() {
  ClassicEditor
    .create( document.querySelector( 'textarea#ta' ) )
    .catch( error => {
        console.error( error );
    });

  $('a.confirmDeletion').on('click', function() {
    if(!confirm('Confirm deletion')) return false;
  });

  console.log(ClassicEditor.build.plugins.map( plugin => plugin.pluginName ));
});