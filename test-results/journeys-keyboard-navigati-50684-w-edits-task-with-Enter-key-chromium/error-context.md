# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e14]:
    - generic [ref=e15]:
      - heading "Sign In" [level=1] [ref=e16]
      - paragraph [ref=e17]: Enter your credentials to continue
    - button "Continue with Google" [ref=e18]:
      - img
      - text: Continue with Google
    - generic [ref=e23]: Or continue with email
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]: Email
          - textbox "Email" [ref=e28]:
            - /placeholder: you@example.com
        - generic [ref=e29]:
          - generic [ref=e30]: Password
          - textbox "Password" [ref=e31]
      - button "Sign In" [ref=e32]
    - paragraph [ref=e33]:
      - text: Don't have an account?
      - link "Create one" [ref=e34] [cursor=pointer]:
        - /url: /auth/sign-up
```