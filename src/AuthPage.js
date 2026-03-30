import React, { useState } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Alert, Tabs, Tab } from "@mui/material";
import { useAuth } from "./AuthContext";

export default function AuthPage() {
  const { signIn, signUp, confirmSignUp } = useAuth();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await signUp(email, password);
      setNeedsConfirm(true);
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await confirmSignUp(email, code);
      setNeedsConfirm(false);
      setTab(0);
    } catch (err) {
      setError(err.message || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirm) {
    return (
      <Box component="form" onSubmit={handleConfirm} sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
        <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>Check your email</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Enter the confirmation code sent to {email}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth label="Confirmation Code" value={code} onChange={(e) => setCode(e.target.value)} required sx={{ mb: 2 }} />
        <Button fullWidth type="submit" variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Confirm"}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(""); }} centered textColor="primary" indicatorColor="primary" sx={{ mb: 3 }}>
        <Tab label="Sign In" />
        <Tab label="Sign Up" />
      </Tabs>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={tab === 0 ? handleSignIn : handleSignUp}>
        <TextField fullWidth required label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth required label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />
        <Button fullWidth type="submit" variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : tab === 0 ? "Sign In" : "Sign Up"}
        </Button>
      </Box>
    </Box>
  );
}
