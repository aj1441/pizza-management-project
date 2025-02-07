import { useState, useEffect } from "react";
import api from "../api";

const ToppingsList = () => {
    // Update the state variable with the fetched data
  const [toppings, setToppings] = useState([]);
  const [newTopping, setNewTopping] = useState("");
  const [error, setError] = useState("");
  const [editToppingId, setEditToppingId] = useState(null);
  const [editToppingName, setEditToppingName] = useState("");

// Fetch toppings from the backend and save them to state
  const fetchToppings = async () => {
  // Start a block to attempt the API request
    try {
    // Send a GET request to the API endpoint and store the response
      const response = await api.get("/toppings");
    // Update the state variable with the fetched data
      setToppings(response.data);
  // Catch and handle any errors that occur during the request
    } catch (err) {
    // Log the error for debugging purposes
      console.error("Error fetching toppings:", err);
    }
  };

  // Fetch toppings on component mount
  useEffect(() => {
    fetchToppings();
  }, []);

  // Function to add a new topping
  const addTopping = async () => {
    // Check if the new topping name is empty
    if (!newTopping) {
      // If it is, set an error message and exit the function
      setError("Topping name cannot be empty.");
      return;
    }

    // Check for duplicates (case-insensitive)
    if (toppings.some((t) => t.name.toLowerCase() === newTopping.toLowerCase())) {
      // If a duplicate is found, set an error message and exit the function
      setError("Topping already exists.");
      return;
    }

    // Start a block to attempt the API request
    try {
      // Send a POST request to the API endpoint to add the new topping
      const response = await api.post("/toppings", { name: newTopping });

      // Update the state variable with the new topping added
      setToppings([...toppings, response.data]);

      // Clear the new topping input and any existing error messages
      setNewTopping("");
      setError("");

    // Catch and handle any errors that occur during the request
    } catch (err) {
      // Log the error for debugging purposes
      console.error("Error adding topping:", err);
      // Set an error message indicating the topping could not be added
      setError("Could not add topping. It may already exist.");
    }
  };

  // Function to handle the editing of a topping
  const handleEdit = (id, currentName) => {
    // Set the ID of the topping being edited
    setEditToppingId(id);

    // Set the current name of the topping being edited
    setEditToppingName(currentName);
  };

  // Function to save the edits made to a topping
  const saveEdit = async () => {
    // Check if the edited topping name is empty
    if (!editToppingName) {
      // If it is, set an error message and exit the function
      setError("Topping name cannot be empty.");
      return;
    }

    // Start a block to attempt the API request
    try {
      // Send a PUT request to the API endpoint to update the topping
      const response = await api.put(`/toppings/${editToppingId}`, { name: editToppingName });

      // Update the state variable with the updated topping data
      setToppings(toppings.map((topping) =>
        topping.id === editToppingId ? response.data : topping
      ));

      // Reset the editing state
      setEditToppingId(null);
      setEditToppingName("");
      setError("");

    // Catch and handle any errors that occur during the request
    } catch (err) {
      // Log the error for debugging purposes
      console.error("Error updating topping:", err);
      // Set an error message indicating the update failed
      setError("Failed to update topping. It may already exist.");
    }
  };
//function to cancel editing a topping
  const cancelEdit = () => {
    setEditToppingId(null);
    setEditToppingName("");
    setError("");
  };

  // Delete a topping with affected pizzas check
  const deleteTopping = async (id) => {
    console.log("Attempting to delete topping with ID:", id); // Debugging
  // Start a block to attempt the API request
    try {
      // Attempt to delete normally
      await api.delete(`/toppings/${id}`);
      alert("Topping deleted successfully!");
      fetchToppings(); // Refresh toppings list
  // Catch and handle any errors that occur during the request
    } catch (err) {
      // If topping is in use, show affected pizzas and allow forced deletion
      if (err.response?.data?.affectedPizzas) {
        const affectedPizzas = err.response.data.affectedPizzas;
        const pizzaList = affectedPizzas.map((pizza) => pizza.name).join(", ");
        const confirmed = window.confirm(
          `This topping is used by the following pizzas: ${pizzaList}. Are you sure you want to delete it?`
        );
        if (confirmed) {
  // Start a block to attempt the API request
          try {
            await api.delete(`/toppings/${id}?force=true`); // Force delete
            alert("Topping deleted successfully!");
            fetchToppings();
  // Catch and handle any errors that occur during the request
          } catch (forceErr) {
    // Log the error for debugging purposes
            console.error("Failed to delete topping after confirmation:", forceErr);
          }
        }
      } else {
    // Log the error for debugging purposes
        console.error("Error deleting topping:", err);
        alert("Failed to delete topping. Please try again.");
      }
    }
  };
  

// Render the ToppingsList Component's output
  return (
    <div className="toppings-main">
      <h2>Manage Toppings</h2>

      <ul>
        {toppings.map((topping) => (
          <li className="toppings" key={topping.id}>
            {editToppingId === topping.id ? (
              <div className="item-grid-containter">
                <input
                  type="text"
                  value={editToppingName}
                  onChange={(e) => setEditToppingName(e.target.value)}
                  placeholder="Edit topping name"
                />
                <button className="editToppingButton" onClick={saveEdit}>Save</button>
                <button className="deleteToppingButton" onClick={cancelEdit}>Cancel</button>
              </div>
            ) : (
              <div className="item-grid-containter">
                <p className="topping-name">{topping.name}</p>
                <button className="editToppingButton" onClick={() => handleEdit(topping.id, topping.name)}>Edit</button>
                <button className="deleteToppingButton" onClick={() => deleteTopping(topping.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="add-item-container">
        <input
          type="text"
          value={newTopping}
          onChange={(e) => setNewTopping(e.target.value)}
          placeholder="New topping"
        />
        <button onClick={addTopping}>Add Topping</button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ToppingsList;
