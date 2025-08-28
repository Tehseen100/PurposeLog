const isAuthenticated = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res
      .status(403)
      .json({ success: false, message: "User not authenticated" });
  }
  next();
};

export default isAuthenticated;
