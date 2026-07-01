function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          color: "#94a3b8",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          color: "#fff",
          padding: "10px 12px",
          borderRadius: 8,
          outline: "none",
        }}
      />
    </div>
  );
}

export default FormField;