let pokeRepo = (function() {
  let pokemonList = [];
  let apiUrl = "https://pokeapi.co/api/v2/pokemon/?limit=150";

  function getAll() {
      return pokemonList;
  }

  function add(pokemon) {
      pokemonList.push(pokemon);
  }

  function loadList() {
      return fetch(apiUrl)
          .then(function(response) {
              return response.json();
          })
          .then(function(json) {
              json.results.forEach(function(item) {
                  let pokemon = {
                      name: item.name,
                      detailsUrl: item.url
                  };
                  add(pokemon);
              });
          })
          .catch(function(error) {
              console.error(error);
          });
  }

  function loadDetails(pokemon) {
      return fetch(pokemon.detailsUrl)
          .then(function(response) {
              return response.json();
          })
          .then(function(details) {
              pokemon.height = details.height / 10;
              pokemon.types = details.types.map(function(type) {
                  return type.type.name;
              }).join(", ");
          })
          .catch(function(error) {
              console.error(error);
          });
  }

  function showDetails(pokemon) {
      loadDetails(pokemon).then(function() {
          console.log("Height: " + pokemon.height + "m");
          console.log("Types: " + pokemon.types);
      });
  }

  function addButtonEvent(button, pokemon) {
      button.addEventListener("click", function() {
          showDetails(pokemon);
      });
  }

  function addListItem(pokemon) {
      let pokemonList = document.querySelector(".pokemon-list");
      let listItem = document.createElement("li");
      let button = document.createElement("button");
      
      button.innerText = pokemon.name;
      button.classList.add("pokemon-button");
      
      listItem.appendChild(button);
      pokemonList.appendChild(listItem);
      
      addButtonEvent(button, pokemon);
  }

  return {
      getAll: getAll,
      add: add,
      addListItem: addListItem,
      loadList: loadList,
      loadDetails: loadDetails,
      showDetails: showDetails
  };
})();

pokeRepo.loadList().then(function() {
  pokeRepo.getAll().forEach(pokemon => {
      pokeRepo.addListItem(pokemon);
  });
});