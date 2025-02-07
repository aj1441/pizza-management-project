// Import the database connection pool from the db module
const pool = require("../database/db");

// Function to get all pizzas from the database
const getAllPizzas = async (req, res) => {
  // Attempt to execute the database operation
  try {
    // Execute the SQL query to fetch pizzas and their toppings
    const result = await pool.query(
      `SELECT p.id, p.name, 
      COALESCE(JSON_AGG(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL), '[]') AS toppings
      FROM pizzas p
      LEFT JOIN pizza_toppings pt ON p.id = pt.pizza_id
      LEFT JOIN toppings t ON pt.topping_id = t.id
      GROUP BY p.id;`
    );

    // Send the fetched data as a JSON response
    res.json(result.rows);
  } catch (err) {
    // Handle errors that occur during the operation
    // Send a 500 status code and an error message as a JSON response
    res.status(500).json({ error: "Failed to fetch pizzas" });
  }
};

// Function to capitalize the first letter of a name
const capitalizeName = (name) => {
  // Capitalize the first letter and convert the rest to lowercase
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Function to create a new pizza
const createPizza = async (req, res) => {
  // Destructure name and toppings from the request body
  let { name, toppings } = req.body;

  // Attempt to execute the database operation
  try {
    // Capitalize the pizza name
    name = capitalizeName(name);

    // Fetch all pizzas with their toppings
    const result = await pool.query(`
      SELECT p.id, ARRAY_AGG(pt.topping_id ORDER BY pt.topping_id) AS toppings
      FROM pizzas p
      LEFT JOIN pizza_toppings pt ON p.id = pt.pizza_id
      GROUP BY p.id
    `);

    // Store the fetched pizzas in a variable
    const existingPizzas = result.rows;

    // Sort and compare toppings to ensure uniqueness
    const sortedToppings = (toppings || []).sort((a, b) => a - b);
    const isDuplicate = existingPizzas.some((pizza) =>
      JSON.stringify(pizza.toppings) === JSON.stringify(sortedToppings)
    );

    // If a duplicate pizza is found, return an error response
    if (isDuplicate) {
      return res.status(400).json({ error: "A pizza with the same ingredients already exists." });
    }

    // Insert the new pizza into the database
    const pizzaResult = await pool.query("INSERT INTO pizzas (name) VALUES ($1) RETURNING *", [name]);

    // If toppings are provided, insert them into the pizza_toppings table
    if (toppings && toppings.length > 0) {
      const pizzaId = pizzaResult.rows[0].id;
      const insertPromises = toppings.map((toppingId) =>
        pool.query("INSERT INTO pizza_toppings (pizza_id, topping_id) VALUES ($1, $2)", [pizzaId, toppingId])
      );
      await Promise.all(insertPromises);
    }

    // Fetch the newly created pizza with its toppings
    const newPizza = await pool.query(`
      SELECT p.id, p.name, 
        COALESCE(JSON_AGG(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL), '[]') AS toppings
      FROM pizzas p
      LEFT JOIN pizza_toppings pt ON p.id = pt.pizza_id
      LEFT JOIN toppings t ON pt.topping_id = t.id
      WHERE p.id = $1
      GROUP BY p.id
    `, [pizzaResult.rows[0].id]);

    // Send the newly created pizza as a JSON response
    res.status(201).json(newPizza.rows[0]);
  } catch (err) {
    // Handle errors that occur during the operation
    console.error(err);
    res.status(500).json({ error: "Failed to create pizza." });
  }
};

// Update an existing pizza in the database
const updatePizza = async (req, res) => {
  // Extract the pizza ID from the request parameters
  const { id } = req.params;
  // Extract the name and toppings from the request body
  const { name, toppings } = req.body;

  // Attempt to execute the database operation
  try {
    // Update the pizza name in the database and return the updated pizza
    const pizzaResult = await pool.query("UPDATE pizzas SET name = $1 WHERE id = $2 RETURNING *", [name, id]);

    // If no pizza was found with the given ID, return a 404 error response
    if (pizzaResult.rowCount === 0) return res.status(404).json({ error: "Pizza not found" });

    // Delete existing toppings for the pizza
    await pool.query("DELETE FROM pizza_toppings WHERE pizza_id = $1", [id]);

    // If new toppings are provided, insert them into the pizza_toppings table
    if (toppings && toppings.length > 0) {
      const insertPromises = toppings.map((toppingId) =>
        pool.query("INSERT INTO pizza_toppings (pizza_id, topping_id) VALUES ($1, $2)", [id, toppingId])
      );
      await Promise.all(insertPromises);
    }

    // Send the updated pizza as a JSON response
    res.json(pizzaResult.rows[0]);
  } catch (err) {
    // Handle errors that occur during the operation
    // Send a 400 status code and an error message as a JSON response
    res.status(400).json({ error: "Failed to update pizza" });
  }
};

// Remove a pizza from the database
const deletePizza = async (req, res) => {
  const { id } = req.params;

  // Attempt to execute the database operation
  try {
    const result = await pool.query("DELETE FROM pizzas WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Pizza not found" });
    res.json(result.rows[0]);
  // Handle errors that occur during the operation
  } catch (err) {
    res.status(500).json({ error: "Failed to delete pizza" });
  }
};

module.exports = {
  getAllPizzas,
  createPizza,
  updatePizza,
  deletePizza,
};