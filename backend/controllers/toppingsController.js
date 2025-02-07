// Import the database connection pool from the db module
const pool = require("../database/db");

// Function to get all toppings from the database
const getAllToppings = async (req, res) => {
  // Attempt to execute the database operation
  try {
    // Execute the SQL query to fetch all toppings
    const result = await pool.query("SELECT * FROM toppings");

    // Send the fetched data as a JSON response
    res.json(result.rows);
  } catch (err) {
    // Handle errors that occur during the operation
    // Send a 500 status code and an error message as a JSON response
    res.status(500).json({ error: "Failed to fetch toppings" });
  }
};
// Function to capitalize the first letter of a name
const capitalizeName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };
  
// Function to create a new topping
const createTopping = async (req, res) => {
  // Destructure name from the request body
  let { name } = req.body;

  // Attempt to execute the database operation
  try {
    // Capitalize the topping name
    name = capitalizeName(name);

    // Check if the topping already exists (case-insensitive)
    const result = await pool.query("SELECT * FROM toppings WHERE LOWER(name) = LOWER($1)", [name]);
    if (result.rowCount > 0) {
      // If the topping already exists, return a 400 error response
      return res.status(400).json({ error: "Topping already exists." });
    }

    // Insert the new topping into the database
    const newTopping = await pool.query("INSERT INTO toppings (name) VALUES ($1) RETURNING *", [name]);

    // Send the newly created topping as a JSON response with a 201 status code
    res.status(201).json(newTopping.rows[0]);
  } catch (err) {
    // Handle errors that occur during the operation
    console.error(err);
    // Send a 500 status code and an error message as a JSON response
    res.status(500).json({ error: "Failed to create topping." });
  }
};
  
// Function to update an existing topping
const updateTopping = async (req, res) => {
  // Get the topping ID from the URL
  const { id } = req.params;
  // Get the new topping name from the request body
  let { name } = req.body;

  // Attempt to execute the database operation
  try {
    // Capitalize the topping name for consistency
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    // Check if the new name already exists (case-insensitive)
    const duplicateCheck = await pool.query("SELECT * FROM toppings WHERE LOWER(name) = LOWER($1) AND id != $2", [name, id]);
    if (duplicateCheck.rowCount > 0) {
      // If a duplicate is found, return a 400 error response
      return res.status(400).json({ error: "A topping with this name already exists." });
    }

    // Update the topping in the database
    const result = await pool.query("UPDATE toppings SET name = $1 WHERE id = $2 RETURNING *", [name, id]);

    // If no topping was found with the given ID, return a 404 error response
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Topping not found." });
    }

    // Send the updated topping as a JSON response
    res.status(200).json(result.rows[0]);
  } catch (err) {
    // Handle errors that occur during the operation
    console.error(err);
    // Send a 500 status code and an error message as a JSON response
    res.status(500).json({ error: "Failed to update topping." });
  }
};

// Function to delete a topping
const deleteTopping = async (req, res) => {
  // Extract the topping ID from the request parameters
  const { id } = req.params;
  // Capture the force parameter from the query string
  const { force } = req.query;

  // Debugging: Log the delete request
  console.log("Delete request received for topping ID:", id);

  // Attempt to execute the database operation
  try {
    // Find pizzas using this topping
    const pizzasWithTopping = await pool.query(
      `SELECT p.id, p.name 
       FROM pizzas p
       JOIN pizza_toppings pt ON p.id = pt.pizza_id
       WHERE pt.topping_id = $1`,
      [id]
    );

    // If the topping is used by existing pizzas and force is not true, return an error response
    if (pizzasWithTopping.rows.length > 0 && force !== "true") {
      return res.status(400).json({
        error: "This topping is used by existing pizzas.",
        affectedPizzas: pizzasWithTopping.rows,
      });
    }

    // If force=true or no pizzas are using the topping, delete it
    await pool.query("DELETE FROM pizza_toppings WHERE topping_id = $1", [id]);
    const result = await pool.query("DELETE FROM toppings WHERE id = $1 RETURNING *", [id]);

    // If no topping was found with the given ID, return a 404 error response
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Topping not found" });
    }

    // Send the deleted topping as a JSON response
    res.json(result.rows[0]);
  } catch (err) {
    // Handle errors that occur during the operation
    console.error("Error deleting topping:", err);
    // Send a 500 status code and an error message as a JSON response
    res.status(500).json({ error: "Failed to delete topping." });
  }
};
// Export the functions to be used in other parts of the application

module.exports = {
  getAllToppings,
  createTopping,
  updateTopping,
  deleteTopping,
};