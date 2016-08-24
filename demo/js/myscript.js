(function (root){
  root.MyApi = {
    someMethod: function(myOutput) {
      console.log(root.myDeclaredGlobal, myOutput);
    }
  }
}(window));
