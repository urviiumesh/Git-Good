const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

// Create data directory if it doesn't exist
const DATA_DIR = path.join(__dirname, "data");
const CONVERSATIONS_DIR = path.join(DATA_DIR, "conversations");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CONVERSATIONS_DIR)) {
  fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
}

// Create Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static("public"));

// Test endpoint for health checks
app.get("/test", (req, res) => {
  res.json({ status: "ok" });
});

// Get all conversations
app.get("/conversations", (req, res) => {
  try {
    const files = fs.readdirSync(CONVERSATIONS_DIR);
    const conversations = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const content = fs.readFileSync(
            path.join(CONVERSATIONS_DIR, file),
            "utf-8"
          );
          const conversation = JSON.parse(content);
          conversations.push(conversation);
        } catch (err) {
          console.error(`Error reading conversation file ${file}:`, err);
        }
      }
    }

    res.json({ conversations });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get a specific conversation
app.get("/conversation/:id", (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const conversation = JSON.parse(content);

    res.json(conversation);
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Save a conversation
app.post("/conversation", (req, res) => {
  try {
    const conversation = req.body;

    if (!conversation || !conversation.id) {
      return res.status(400).json({ error: "Invalid conversation data" });
    }

    const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a conversation
app.delete("/conversation/:id", (req, res) => {
  try {
    const id = req.params.id;
    const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete all conversations
app.delete("/conversations", (req, res) => {
  try {
    const files = fs.readdirSync(CONVERSATIONS_DIR);

    for (const file of files) {
      if (file.endsWith(".json")) {
        fs.unlinkSync(path.join(CONVERSATIONS_DIR, file));
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting all conversations:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add an endpoint for cleaning up self-destructing conversations
app.post("/cleanup-self-destruct", (req, res) => {
  try {
    const { selfDestructIds } = req.body;

    if (
      !selfDestructIds ||
      !Array.isArray(selfDestructIds) ||
      selfDestructIds.length === 0
    ) {
      return res
        .status(200)
        .json({ success: true, message: "No conversations to delete" });
    }

    console.log(
      `Received cleanup request for ${selfDestructIds.length} self-destructing conversations`
    );

    // Delete each conversation synchronously
    let deletedCount = 0;
    for (const id of selfDestructIds) {
      try {
        // Check if the conversation exists
        const conversationPath = path.join(CONVERSATIONS_DIR, `${id}.json`);
        if (fs.existsSync(conversationPath)) {
          // Delete the conversation file
          fs.unlinkSync(conversationPath);
          console.log(`Deleted self-destructing conversation: ${id}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Error deleting conversation ${id}:`, err);
      }
    }

    // Also clear the active conversation if it was one of the deleted ones
    try {
      const activeFilePath = path.join(DATA_DIR, "active-conversation.json");
      if (fs.existsSync(activeFilePath)) {
        const activeData = JSON.parse(fs.readFileSync(activeFilePath, "utf8"));
        if (
          activeData &&
          activeData.id &&
          selfDestructIds.includes(activeData.id)
        ) {
          // Either delete the file or reset it to an empty object
          fs.writeFileSync(activeFilePath, JSON.stringify({}), "utf8");
          console.log("Reset active conversation since it was self-destructed");
        }
      }
    } catch (err) {
      console.error("Error clearing active conversation:", err);
    }

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount} self-destructing conversations`
    });
  } catch (error) {
    console.error("Error in cleanup-self-destruct endpoint:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during cleanup" });
  }
});

// Active conversation endpoints
app.get("/active-conversation", (req, res) => {
  try {
    const activeFilePath = path.join(DATA_DIR, "active-conversation.json");

    if (!fs.existsSync(activeFilePath)) {
      return res.json({ id: null });
    }

    const content = fs.readFileSync(activeFilePath, "utf-8");
    const data = JSON.parse(content);

    res.json(data);
  } catch (error) {
    console.error("Error getting active conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/active-conversation/:id", (req, res) => {
  try {
    const id = req.params.id;
    const activeFilePath = path.join(DATA_DIR, "active-conversation.json");

    fs.writeFileSync(activeFilePath, JSON.stringify({ id }, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error("Error setting active conversation:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
