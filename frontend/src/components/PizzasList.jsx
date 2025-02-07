import { useState, useEffect } from "react";
import api from "../api";

const PizzasList = () => {
    // Update the state variable with the fetched data
  const [pizzas, setPizzas] = useState([]);
  const [newPizza, setNewPizza] = useState("");
  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [error, setError] = useState("");
  const [editingPizza, setEditingPizza] = useState(null); // State for editing pizza
  const [editedToppings, setEditedToppings] = useState([]); // State for toppings during edit
  const [editedName, setEditedName] = useState(""); // State for name during edit

  // Fetch pizzas and toppings on component mount
  useEffect(() => {
    const fetchData = async () => {
        // Fetch pizzas and toppings data from the API
        try {
        const pizzasResponse = await api.get("/pizzas");
        const toppingsResponse = await api.get("/toppings");
    // Update the state variable with the fetched data
        setPizzas(pizzasResponse.data);
        setToppings(toppingsResponse.data);
  // Catch and handle any errors that occur during the request
      } catch (err) {
    // Log the error for debugging purposes
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);
  // Function to capitalize the first letter of a pizza name
  const capitalizeName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };
  // Function to add a new pizza
  const addPizza = async () => {
    if (!newPizza) {
            // Set error if pizza name is empty
      setError("Pizza name cannot be empty.");
      return;
    }
    // Format the pizza name and sort selected toppings
    const formattedName = capitalizeName(newPizza);
    const sortedSelectedToppings = [...selectedToppings].sort();
    
    // Check if a pizza with the same toppings already exists
    if (
      pizzas.some(
        (pizza) =>
          JSON.stringify(pizza.toppings.sort()) ===
          JSON.stringify(sortedSelectedToppings)
      )
    ) {
      setError("A pizza with the same ingredients already exists.");
      return;
    }

    // Add the new pizza to the list (API call and state update logic should be here)
    try {
      await api.post("/pizzas", { name: formattedName, toppings: selectedToppings });

      const pizzasResponse = await api.get("/pizzas");
    // Update the state variable with the fetched data
      setPizzas(pizzasResponse.data);

      setNewPizza("");
      setSelectedToppings([]);
      setError("");
  // Catch and handle any errors that occur during the request
    } catch (err) {
    // Log the error for debugging purposes
      console.error("Error adding pizza:", err);
      setError("Could not add pizza. It may already exist.");
    }
  };
// function to delete a pizza
  const deletePizza = async (id) => {
  // Start a block to attempt the API request
    try {
      await api.delete(`/pizzas/${id}`);
    // Update the state variable with the fetched data
      setPizzas(pizzas.filter((pizza) => pizza.id !== id));
  // Catch and handle any errors that occur during the request
    } catch (err) {
    // Log the error for debugging purposes
      console.error("Error deleting pizza:", err);
    }
  };
// function to toggle a topping
  const toggleTopping = (id) => {
    // Check if the topping ID is already in the selectedToppings array
    if (selectedToppings.includes(id)) {
      // If it is, remove it from the array
      setSelectedToppings(selectedToppings.filter((toppingId) => toppingId !== id));
    } else {
      // If it is not, add it to the array
      setSelectedToppings([...selectedToppings, id]);
    }
  };

  //function to edit a pizza
  const startEditing = (pizza) => {
    // Set the pizza being edited
    setEditingPizza(pizza);
    //set the name of the pizza being edited
    setEditedName(pizza.name);
      // Map the toppings of the pizza being edited to their IDs
    setEditedToppings(
      pizza.toppings.map((topping) => {
        // Assuming toppings is an array of objects with `id` and `name`
        const toppingObj = toppings.find((t) => t.name === topping);
      // Return the ID of the topping object, if found
      return toppingObj?.id; // Map to IDs
      }).filter(Boolean) // Filter out null/undefined
    );
  };

  // Function to toggle the selection of a topping while editing a pizza
  const toggleEditTopping = (id) => {
    // Check if the topping ID is already in the editedToppings array
    if (editedToppings.includes(id)) {
      // If it is, remove it from the array
      setEditedToppings(editedToppings.filter((toppingId) => toppingId !== id));
    } else {
      // If it is not, add it to the array
      setEditedToppings([...editedToppings, id]);
    }
  };
// Function to save the edits made to a pizza
const saveEdits = async () => {
  // Check if the edited pizza name is empty
  if (!editedName) {
    // If it is, set an error message and exit the function
    setError("Pizza name cannot be empty.");
    return;
  }

  // Capitalize the edited pizza name
  const formattedName = capitalizeName(editedName);

  // Start a block to attempt the API request
  try {
    // Log the payload for debugging purposes
    console.log("Saving edits with payload:", {
      name: formattedName,
      toppings: editedToppings,
    });

    // Send a PUT request to update the pizza with the edited details
    await api.put(`/pizzas/${editingPizza.id}`, {
      name: formattedName,
      toppings: editedToppings,
    });

    // Fetch the updated list of pizzas from the API
    const pizzasResponse = await api.get("/pizzas");

    // Update the state variable with the fetched data
    setPizzas(pizzasResponse.data);

    // Reset the editing state
    setEditingPizza(null);
    setEditedName("");
    setEditedToppings([]);
    setError("");

  // Catch and handle any errors that occur during the request
  } catch (err) {
    // Log the error for debugging purposes
    console.error("Error saving pizza edits:", err);
    // Set an error message
    setError("Could not save edits.");
  }
};
  
  // Function to cancel editing a pizza
  const cancelEdit = () => {
    setEditingPizza(null);
    setEditedName("");
    setEditedToppings([]);
  };

// Render the PizzasList Component's output
  return (
    <div className="pizza-main">
      <h2>Manage Pizzas</h2>
      <ul className="pizzas-list">
        {pizzas.map((pizza) => (
          <li className="pizzas" key={pizza.id}>
            {pizza.id === editingPizza?.id ? (
              <div className="pizza-grid-container">
                <label htmlFor="">Edit Pizza Name & Toppings</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Pizza name"
                />
                <div>
                  {toppings.map((topping) => (
                    <label key={topping.id}>
                      <input
                        type="checkbox"
                        value={topping.id}
                        onChange={() => toggleEditTopping(topping.id)}
                        checked={editedToppings.includes(topping.id)}
                      />
                      {topping.name}
                    </label>
                  ))}
                </div>
                <button className="pizzaButton" onClick={saveEdits}>Save</button>
                <button className="pizzaButton" onClick={cancelEdit}>Cancel</button>
              </div>
            ) : (
              <div className="pizza-grid-container">
                {pizza.name} -Toppings:{" "}
                {Array.isArray(pizza.toppings) && pizza.toppings.length > 0
                  ? pizza.toppings.map((topping, index) => (
                      <span key={index}>
                        {topping}
                        {index < pizza.toppings.length - 1 ? " " : ""}
                      </span>
                    ))
                  : "No toppings"}
                <button className="pizzaButton" onClick={() => startEditing(pizza)}>Edit</button>
                <button className="pizzaButton" onClick={() => deletePizza(pizza.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="add-item-container">
        <input
          type="text"
          value={newPizza}
          onChange={(e) => setNewPizza(e.target.value)}
          placeholder="New pizza"
        />
        <div>
          {toppings.map((topping) => (
            <label key={topping.id}>
              <input
                type="checkbox"
                value={topping.id}
                onChange={() => toggleTopping(topping.id)}
                checked={selectedToppings.includes(topping.id)}
              />
              {topping.name}
            </label>
          ))}
        </div>
        <button className="addPizzaButton" onClick={addPizza}>Add Pizza</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default PizzasList;
