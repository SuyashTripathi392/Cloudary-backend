// utils/emailTemplate.js

export const SIGNUP_WELCOME_TEMPLATE = (name) => `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Welcome to Cloudary</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body { margin:0; padding:0; font-family:'Open Sans',sans-serif; background:#f8fafc; }
    table, td { border-collapse: collapse; }
    .container { width:100%; max-width:500px; margin:70px 0; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.05);}
    .header { background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:30px; text-align:center;}
    .main-content { padding:40px 30px; color:#1f2937; }
    .button { background:#4f46e5; text-decoration:none; display:inline-block; padding:12px 24px; color:#fff; font-size:14px; font-weight:600; border-radius:8px; margin:20px 0;}
    .footer { padding:20px; text-align:center; font-size:12px; color:#6b7280; background:#f9fafb;}
    @media only screen and (max-width:480px){
      .container{width:90%!important;margin:20px 0!important;}
      .header{padding:20px!important;}
      .main-content{padding:30px 20px!important;}
      .button{padding:10px 20px!important;}
    }
  </style>
</head>
<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#f8fafc">
    <tr>
      <td align="center">
        <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <h1 style="color:#fff; font-size:24px; margin-top:16px; margin-bottom:0;">Welcome to Cloudary</h1>
            </td>
          </tr>
          <tr>
            <td class="main-content">
              <p style="font-size:16px;">Hi ${name},</p>
              <p style="font-size:16px;">Welcome to Cloudary! We're thrilled to have you on board. Your account has been successfully created 🎉</p>
              <p style="font-size:16px;">With Cloudary, you can:</p>
              <ul style="font-size:16px; padding-left:20px;">
                <li>Store and access your files from anywhere</li>
                <li>Share files securely with colleagues</li>
                <li>Enjoy end-to-end encryption for maximum security</li>
                <li>Get started with 15GB of free storage</li>
              </ul>
              <p style="margin-top:20px; font-size:16px;">If you have any questions, feel free to reply to this email.</p>
              <p style="font-size:16px;">Happy storing!<br/>The Cloudary Team</p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              © 2023 Cloudary. All rights reserved. <br/> 123 Cloud Street, Internet City
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;


export const PASSWORD_RESET_TEMPLATE = `

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Password Reset</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', sans-serif;
      background: #E5E5E5;
    }

    table, td {
      border-collapse: collapse;
    }

    .container {
      width: 100%;
      max-width: 500px;
      margin: 70px 0px;
      background-color: #ffffff;
    }

    .main-content {
      padding: 48px 30px 40px;
      color: #000000;
    }

    .button {
      width: 100%;
      background: #22D172;
      text-decoration: none;
      display: inline-block;
      padding: 10px 0;
      color: #fff;
      font-size: 14px;
      text-align: center;
      font-weight: bold;
      border-radius: 7px;
    }

    @media only screen and (max-width: 480px) {
      .container {
        width: 80% !important;
      }

      .button {
        width: 50% !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F6FAFB">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td style="padding: 0 0 24px; font-size: 18px; line-height: 150%; font-weight: bold;">
                          Forgot your password?
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          We received a password reset request for your account: <span style="color: #4C83EE;">{{email}}</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px; font-size: 14px; line-height: 150%; font-weight: 700;">
                          Use the OTP below to reset the password.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 24px;">
                          <p class="button" >{{otp}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          The password reset otp is only valid for the next 15 minutes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`


