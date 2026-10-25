import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import IconButton from "../ui/IconButton";
import TextField, { type TextFieldProps } from "./TextField";

export default function PasswordField(
  props: Omit<TextFieldProps, "type" | "trailing">,
) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      trailing={
        <IconButton
          label={`${show ? "Hide" : "Show"} ${props.label.toLowerCase()}`}
          onClick={() => setShow((s) => !s)}
          className="size-9"
        >
          {show ? (
            <LuEyeOff className="size-4" />
          ) : (
            <LuEye className="size-4" />
          )}
        </IconButton>
      }
    />
  );
}
