import React from "react";

export default function ExperiencePage(props: any) {
  const params = props?.params;

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Apex Research Terminal</h1>

      <h3>DEBUG</h3>
      <p>If you see this, you are hitting the correct deployed file.</p>

      <h4>props.params</h4>
      <pre>{JSON.stringify(params, null, 2)}</pre>

      <h4>props</h4>
      <pre>{JSON.stringify(Object.keys(props || {}), null, 2)}</pre>
    </div>
  );
}
