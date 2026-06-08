package com.truewrist.backend.service;

import com.truewrist.backend.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends system emails. When {@code app.mail.enabled} is false (or no SMTP sender
 * is configured), it logs the message instead of sending — so flows like password
 * reset still work end-to-end in local dev without a mail server.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final AppProperties props;

    public MailService(ObjectProvider<JavaMailSender> mailSenderProvider, AppProperties props) {
        this.mailSenderProvider = mailSenderProvider;
        this.props = props;
    }

    public void sendPasswordReset(String toEmail, String name, String resetUrl) {
        long ttl = props.passwordReset().ttlMinutesOrDefault();
        String subject = "Đặt lại mật khẩu TrueWrist";
        String body = "Xin chào " + (name == null || name.isBlank() ? "bạn" : name) + ",\n\n"
                + "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TrueWrist của bạn.\n"
                + "Nhấn vào liên kết dưới đây để đặt lại mật khẩu (liên kết có hiệu lực trong "
                + ttl + " phút):\n\n"
                + resetUrl + "\n\n"
                + "Nếu bạn không yêu cầu, vui lòng bỏ qua email này — mật khẩu của bạn sẽ không thay đổi.\n\n"
                + "Trân trọng,\nĐội ngũ TrueWrist";

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        boolean enabled = props.mail() != null && props.mail().enabled();
        if (!enabled || sender == null) {
            log.warn("[MAIL DISABLED] Reset link for {} → {}", toEmail, resetUrl);
            return;
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            if (props.mail().from() != null && !props.mail().from().isBlank()) {
                msg.setFrom(props.mail().from());
            }
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
            log.info("Sent password reset email to {}", toEmail);
        } catch (Exception e) {
            // Don't fail the request if the mail server hiccups; log the link so
            // the user can still be helped manually.
            log.error("Failed to send reset email to {}: {}", toEmail, e.getMessage());
            log.warn("[MAIL FALLBACK] Reset link for {} → {}", toEmail, resetUrl);
        }
    }
}
